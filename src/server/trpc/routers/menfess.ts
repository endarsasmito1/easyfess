import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/trpc/trpc";
import { menfess, menfessMedia, bases } from "@/server/db/schema";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { moderateContent } from "@/server/services/moderator";
import { deductCoin } from "@/server/services/payment";
import { MAX_TWEET_LENGTH } from "@/server/lib/constants";
import { TRPCError } from "@trpc/server";

export const menfessRouter = createTRPCRouter({
  // Submit a new menfess
  submit: protectedProcedure
    .input(
      z.object({
        baseId: z.string().uuid(),
        content: z.string().min(1).max(MAX_TWEET_LENGTH),
        mediaIds: z.array(z.string().uuid()).max(4).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;

      // Verify base exists and is active
      const base = await ctx.db.query.bases.findFirst({
        where: eq(bases.id, input.baseId),
      });

      if (!base || !base.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Base tidak ditemukan atau tidak aktif",
        });
      }

      // Check content against trigger word length
      const fullContent = `${base.triggerWord} ${input.content}`;
      if (fullContent.length > MAX_TWEET_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Pesan terlalu panjang. Maks ${MAX_TWEET_LENGTH - base.triggerWord.length - 1} karakter (termasuk trigger word).`,
        });
      }

      // Moderate content
      const modResult = await moderateContent(input.content, input.baseId);
      if (!modResult.isClean) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Pesan ditolak: Mengandung kata yang tidak diizinkan (${modResult.matchedWords.join(", ")})`,
        });
      }

      // Deduct coin
      const deducted = await deductCoin(userId);
      if (!deducted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Saldo koin tidak mencukupi. Silakan top-up terlebih dahulu.",
        });
      }

      // Insert menfess into queue
      const [newMenfess] = await ctx.db
        .insert(menfess)
        .values({
          senderId: userId,
          baseId: input.baseId,
          content: input.content,
          status: "queued",
        })
        .returning();

      return {
        id: newMenfess!.id,
        status: "queued" as const,
        message: "Menfess berhasil dikirim dan masuk antrean!",
      };
    }),

  // Get sender's menfess history
  getHistory: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        status: z
          .enum(["queued", "processing", "posted", "failed", "rejected"])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;
      const offset = (input.page - 1) * input.limit;

      const conditions = [eq(menfess.senderId, userId)];
      if (input.status) {
        conditions.push(eq(menfess.status, input.status));
      }

      const [items, [totalResult]] = await Promise.all([
        ctx.db
          .select()
          .from(menfess)
          .where(and(...conditions))
          .orderBy(desc(menfess.createdAt))
          .limit(input.limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(menfess)
          .where(and(...conditions)),
      ]);

      return {
        items,
        total: totalResult?.count ?? 0,
        page: input.page,
        totalPages: Math.ceil((totalResult?.count ?? 0) / input.limit),
      };
    }),

  // Get single menfess by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;

      const item = await ctx.db.query.menfess.findFirst({
        where: and(eq(menfess.id, input.id), eq(menfess.senderId, userId)),
        with: {
          media: true,
          base: {
            columns: {
              displayName: true,
              slug: true,
              triggerWord: true,
            },
          },
        },
      });

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Menfess tidak ditemukan" });
      }

      return item;
    }),

  // Get queue stats for a base (Base Owner)
  getQueueStats: protectedProcedure
    .input(z.object({ baseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const statuses = ["queued", "processing", "posted", "failed", "rejected"] as const;
      const results: Record<string, number> = {};

      for (const status of statuses) {
        const [result] = await ctx.db
          .select({ count: count() })
          .from(menfess)
          .where(and(eq(menfess.baseId, input.baseId), eq(menfess.status, status)));

        results[status] = result?.count ?? 0;
      }

      return results;
    }),
});
