import { db } from "@/server/db";
import { menfess, bases, menfessMedia } from "@/server/db/schema";
import { eq, and, asc, sql, lte } from "drizzle-orm";
import { postTweet, uploadMediaToTwitter } from "./twitter";
import { refundCoin } from "./payment";

const MAX_RETRY_COUNT = 3;
const COOLDOWN_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Process the menfess queue. Called by cron job.
 * Picks the oldest queued menfess for each active base and posts it.
 */
export async function processQueue(): Promise<{
  processed: number;
  posted: number;
  failed: number;
  rateLimited: number;
}> {
  const stats = { processed: 0, posted: 0, failed: 0, rateLimited: 0 };

  // Get all active bases that are not in cooldown
  const activeBases = await db
    .select()
    .from(bases)
    .where(
      and(
        eq(bases.isActive, true),
        sql`(${bases.cooldownUntil} IS NULL OR ${bases.cooldownUntil} <= NOW())`
      )
    );

  for (const base of activeBases) {
    // Get the oldest queued menfess for this base
    const [queuedMenfess] = await db
      .select()
      .from(menfess)
      .where(
        and(eq(menfess.baseId, base.id), eq(menfess.status, "queued"))
      )
      .orderBy(asc(menfess.createdAt))
      .limit(1);

    if (!queuedMenfess) continue;

    stats.processed++;

    // Mark as processing
    await db
      .update(menfess)
      .set({ status: "processing" })
      .where(eq(menfess.id, queuedMenfess.id));

    // Prepend trigger word
    const tweetContent = `${base.triggerWord} ${queuedMenfess.content}`;

    // Check if there are media attachments
    const mediaAttachments = await db
      .select()
      .from(menfessMedia)
      .where(eq(menfessMedia.menfessId, queuedMenfess.id));

    // Upload media to Twitter if any
    let mediaIds: string[] = [];
    if (mediaAttachments.length > 0 && base.xAccessTokenEnc && base.xAccessSecretEnc) {
      for (const media of mediaAttachments) {
        const result = await uploadMediaToTwitter(
          base.xAccessTokenEnc,
          base.xAccessSecretEnc,
          media.url,
          media.type
        );
        if (result) {
          mediaIds.push(result.mediaId);
        }
      }
    }

    // Post the tweet
    if (!base.xAccessTokenEnc || !base.xAccessSecretEnc) {
      await db
        .update(menfess)
        .set({
          status: "failed",
          failureReason: "Base tokens not configured",
        })
        .where(eq(menfess.id, queuedMenfess.id));
      stats.failed++;
      continue;
    }

    const result = await postTweet(
      base.xAccessTokenEnc,
      base.xAccessSecretEnc,
      tweetContent,
      mediaIds.length > 0 ? mediaIds : undefined
    );

    if (result.success) {
      // Success - update status to posted
      await db
        .update(menfess)
        .set({
          status: "posted",
          postedTweetId: result.tweetId ?? null,
          postedTweetUrl: result.tweetUrl ?? null,
          postedAt: new Date(),
        })
        .where(eq(menfess.id, queuedMenfess.id));
      stats.posted++;
    } else if (result.isRateLimited) {
      // Rate limited - set cooldown on the base, revert menfess to queued
      await db
        .update(bases)
        .set({
          cooldownUntil: new Date(Date.now() + COOLDOWN_DURATION_MS),
        })
        .where(eq(bases.id, base.id));

      await db
        .update(menfess)
        .set({
          status: "queued",
          retryCount: sql`${menfess.retryCount} + 1`,
        })
        .where(eq(menfess.id, queuedMenfess.id));

      stats.rateLimited++;
    } else {
      // Other failure
      const newRetryCount = queuedMenfess.retryCount + 1;

      if (newRetryCount >= MAX_RETRY_COUNT) {
        // Permanently failed - refund coin
        await db
          .update(menfess)
          .set({
            status: "failed",
            failureReason: result.error ?? "Unknown error after max retries",
            retryCount: newRetryCount,
          })
          .where(eq(menfess.id, queuedMenfess.id));

        // Refund the sender's coin
        await refundCoin(queuedMenfess.senderId, "System failure after max retries");

        stats.failed++;
      } else {
        // Retry - set back to queued
        await db
          .update(menfess)
          .set({
            status: "queued",
            retryCount: newRetryCount,
            failureReason: result.error,
          })
          .where(eq(menfess.id, queuedMenfess.id));
      }
    }
  }

  return stats;
}
