import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/trpc/trpc";
import { wallets, walletTransactions } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { createTopUpTransaction, TOP_UP_PACKAGES } from "@/server/services/payment";
import { TRPCError } from "@trpc/server";

export const walletRouter = createTRPCRouter({
  // Get current user's coin balance
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session.user as { id: string }).id;

    const wallet = await ctx.db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    return {
      balance: wallet?.balance ?? 0,
    };
  }),

  // Get transaction history
  getTransactions: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;
      const offset = (input.page - 1) * input.limit;

      const wallet = await ctx.db.query.wallets.findFirst({
        where: eq(wallets.userId, userId),
      });

      if (!wallet) {
        return { items: [], total: 0, page: input.page, totalPages: 0 };
      }

      const items = await ctx.db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, wallet.id))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(input.limit)
        .offset(offset);

      return {
        items,
        page: input.page,
      };
    }),

  // Get available top-up packages
  getPackages: protectedProcedure.query(() => {
    return TOP_UP_PACKAGES;
  }),

  // Create a top-up transaction (initiate payment)
  createTopUp: protectedProcedure
    .input(
      z.object({
        packageId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;

      const result = await createTopUpTransaction(userId, input.packageId);

      if (result.error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }

      return {
        transactionId: result.transactionId,
        qrisUrl: result.qrisUrl,
      };
    }),

  // Check payment status (polling)
  checkPaymentStatus: protectedProcedure
    .input(z.object({ txId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const tx = await ctx.db.query.walletTransactions.findFirst({
        where: eq(walletTransactions.id, input.txId),
      });

      if (!tx) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Transaksi tidak ditemukan" });
      }

      return {
        status: tx.status,
        amount: tx.amount,
      };
    }),
});
