import { NextRequest, NextResponse } from "next/server";
import { processPaymentWebhook } from "@/server/services/payment";

/**
 * Payment gateway webhook handler.
 * Receives callbacks from Midtrans/Xendit when payment status changes.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // TODO: Verify webhook signature from Midtrans/Xendit
    // const signature = req.headers.get("x-webhook-signature");
    // if (!verifySignature(body, signature)) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    const { order_id, transaction_status, transaction_id } = body;

    let status: "success" | "failed" | "expired";
    switch (transaction_status) {
      case "capture":
      case "settlement":
        status = "success";
        break;
      case "expire":
        status = "expired";
        break;
      default:
        status = "failed";
    }

    const result = await processPaymentWebhook(
      transaction_id ?? "",
      status,
      order_id
    );

    if (!result) {
      return NextResponse.json(
        { error: "Transaction not found or already processed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Webhook] Payment processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
