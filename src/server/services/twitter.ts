import { decrypt } from "./encryption";

interface TwitterPostResult {
  success: boolean;
  tweetId?: string;
  tweetUrl?: string;
  error?: string;
  isRateLimited?: boolean;
}

interface TwitterMediaUploadResult {
  mediaId: string;
}

/**
 * Post a tweet to X using OAuth 1.0a tokens (Base Owner's tokens).
 * In production, this uses the X API v2 endpoint.
 */
export async function postTweet(
  encryptedAccessToken: string,
  encryptedAccessSecret: string,
  content: string,
  mediaIds?: string[]
): Promise<TwitterPostResult> {
  try {
    const accessToken = decrypt(encryptedAccessToken);
    const accessSecret = decrypt(encryptedAccessSecret);

    // X API v2: POST https://api.twitter.com/2/tweets
    const body: Record<string, unknown> = { text: content };

    if (mediaIds && mediaIds.length > 0) {
      body.media = { media_ids: mediaIds };
    }

    // TODO: Implement proper OAuth 1.0a signature generation
    // For now, using Bearer token approach (OAuth 2.0)
    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      return {
        success: false,
        error: "Rate limited by X API",
        isRateLimited: true,
      };
    }

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        success: false,
        error: `X API error (${response.status}): ${errorBody}`,
        isRateLimited: false,
      };
    }

    const data = await response.json();
    const tweetId = data.data?.id;

    return {
      success: true,
      tweetId,
      tweetUrl: tweetId
        ? `https://x.com/i/status/${tweetId}`
        : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error posting tweet",
      isRateLimited: false,
    };
  }
}

/**
 * Upload media to X (images/videos).
 * Uses X API v1.1 media upload endpoint.
 */
export async function uploadMediaToTwitter(
  encryptedAccessToken: string,
  encryptedAccessSecret: string,
  mediaUrl: string,
  mediaType: "image" | "video"
): Promise<TwitterMediaUploadResult | null> {
  try {
    // TODO: Implement media upload via X API v1.1
    // POST https://upload.twitter.com/1.1/media/upload.json
    // This requires downloading the media from our storage,
    // then uploading it to Twitter using multipart/form-data.
    console.log(`[Twitter] Would upload ${mediaType} from ${mediaUrl}`);
    return null;
  } catch (error) {
    console.error("[Twitter] Media upload failed:", error);
    return null;
  }
}
