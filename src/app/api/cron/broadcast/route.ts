import { NextRequest, NextResponse } from "next/server";
import { processQueue } from "@/server/services/broadcaster";

/**
 * Cron endpoint for processing the menfess queue.
 * Protected by CRON_SECRET to prevent unauthorized access.
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/broadcast",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await processQueue();

    console.log(
      `[Cron] Queue processed: ${stats.processed} total, ${stats.posted} posted, ${stats.failed} failed, ${stats.rateLimited} rate-limited`
    );

    return NextResponse.json({
      status: "ok",
      ...stats,
    });
  } catch (error) {
    console.error("[Cron] Broadcast error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
