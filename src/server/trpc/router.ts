import { createTRPCRouter } from "@/server/trpc/trpc";
import { authRouter } from "./routers/auth";
import { menfessRouter } from "./routers/menfess";
import { baseRouter } from "./routers/base";
import { walletRouter } from "./routers/wallet";
import { moderationRouter } from "./routers/moderation";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  menfess: menfessRouter,
  base: baseRouter,
  wallet: walletRouter,
  moderation: moderationRouter,
});

export type AppRouter = typeof appRouter;
