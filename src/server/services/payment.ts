import { db } from "@/server/db";
import { wallets, walletTransactions } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";

interface TopUpPackage {
  id: string;
  coins: number;
  priceIdr: number;
  label: string;
}

export const TOP_UP_PACKAGES: TopUpPackage[] = [
  { id: "pkg_50", coins: 50, priceIdr: 5000, label: "50 Koin" },
  { id: "pkg_100", coins: 100, priceIdr: 10000, label: "100 Koin" },
  { id: "pkg_250", coins: 250, priceIdr: 22500, label: "250 Koin (Hemat 10%)" },
  { id: "pkg_500", coins: 500, priceIdr: 40000, label: "500 Koin (Hemat 20%)" },
];

/**
 * Create a pending top-up transaction and generate payment via Midtrans.
 */
export async function createTopUpTransaction(
  userId: string,
  packageId: string
): Promise<{ transactionId: string; qrisUrl?: string; error?: string }> {
  const pkg = TOP_UP_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    return { transactionId: "", error: "Paket tidak ditemukan" };
  }

  // Get user wallet
  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  });

  if (!wallet) {
    return { transactionId: "", error: "Wallet tidak ditemukan" };
  }

  // Create pending transaction
  const [tx] = await db
    .insert(walletTransactions)
    .values({
      walletId: wallet.id,
      type: "topup",
      amount: pkg.coins,
      status: "pending",
      metadata: { packageId: pkg.id, priceIdr: pkg.priceIdr },
    })
    .returning();

  if (!tx) {
    return { transactionId: "", error: "Gagal membuat transaksi" };
  }

  // TODO: Call Midtrans/Xendit API to create QRIS payment
  // const midtransResponse = await createMidtransTransaction({
  //   orderId: tx.id,
  //   grossAmount: pkg.priceIdr,
  //   paymentType: "qris",
  // });

  return {
    transactionId: tx.id,
    qrisUrl: undefined, // Will be populated by payment gateway
  };
}

/**
 * Process webhook from payment gateway.
 * Called when payment is confirmed.
 */
export async function processPaymentWebhook(
  externalTxId: string,
  status: "success" | "failed" | "expired",
  transactionId: string
): Promise<boolean> {
  const tx = await db.query.walletTransactions.findFirst({
    where: eq(walletTransactions.id, transactionId),
  });

  if (!tx || tx.status !== "pending") return false;

  // Update transaction status
  await db
    .update(walletTransactions)
    .set({
      status,
      externalTxId,
    })
    .where(eq(walletTransactions.id, transactionId));

  // If success, credit wallet
  if (status === "success") {
    await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${tx.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, tx.walletId));
  }

  return true;
}

/**
 * Deduct 1 coin from user's wallet (used when submitting menfess).
 * Returns true if deduction was successful.
 */
export async function deductCoin(userId: string): Promise<boolean> {
  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  });

  if (!wallet || wallet.balance < 1) return false;

  // Atomic deduction with balance check
  const result = await db
    .update(wallets)
    .set({
      balance: sql`${wallets.balance} - 1`,
      updatedAt: new Date(),
    })
    .where(
      sql`${wallets.id} = ${wallet.id} AND ${wallets.balance} >= 1`
    )
    .returning();

  if (result.length === 0) return false;

  // Log the debit transaction
  await db.insert(walletTransactions).values({
    walletId: wallet.id,
    type: "debit",
    amount: 1,
    status: "success",
  });

  return true;
}

/**
 * Refund 1 coin to user (used when menfess permanently fails due to system error).
 */
export async function refundCoin(userId: string, reason: string): Promise<boolean> {
  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  });

  if (!wallet) return false;

  await db
    .update(wallets)
    .set({
      balance: sql`${wallets.balance} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(wallets.id, wallet.id));

  await db.insert(walletTransactions).values({
    walletId: wallet.id,
    type: "refund",
    amount: 1,
    status: "success",
    metadata: { reason },
  });

  return true;
}
