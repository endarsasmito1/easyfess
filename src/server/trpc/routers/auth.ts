import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/trpc/trpc";
import { users, wallets } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const authRouter = createTRPCRouter({
  // Get current session
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),

  // Get user profile with wallet info
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session.user as { id: string }).id;

    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const wallet = await ctx.db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    if (!user) return null;

    return {
      id: user.id,
      xUsername: user.xUsername,
      xDisplayName: user.xDisplayName,
      xProfileImage: user.xProfileImage,
      role: user.role,
      coinBalance: wallet?.balance ?? 0,
      createdAt: user.createdAt,
    };
  }),
});
