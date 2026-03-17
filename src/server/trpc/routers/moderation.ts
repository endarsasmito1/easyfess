import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  baseOwnerProcedure,
  publicProcedure,
} from "@/server/trpc/trpc";
import { globalBlacklists, baseBlacklists } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { moderateContent } from "@/server/services/moderator";
import { TRPCError } from "@trpc/server";

export const moderationRouter = createTRPCRouter({
  // Check content against blacklists (used by submit form preview)
  checkContent: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
        baseId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      return moderateContent(input.content, input.baseId);
    }),

  // Add blacklist word (global for admin, per-base for base owner)
  addBlacklistWord: baseOwnerProcedure
    .input(
      z.object({
        baseId: z.string().uuid().optional(),
        word: z.string().min(1).max(128),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.baseId) {
        // Per-base blacklist
        await ctx.db.insert(baseBlacklists).values({
          baseId: input.baseId,
          word: input.word.toLowerCase(),
        });
      } else {
        // Global blacklist (admin only in future)
        await ctx.db.insert(globalBlacklists).values({
          word: input.word.toLowerCase(),
        });
      }
      return { success: true };
    }),

  // Remove blacklist word
  removeBlacklistWord: baseOwnerProcedure
    .input(z.object({ id: z.string().uuid(), isGlobal: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      if (input.isGlobal) {
        await ctx.db.delete(globalBlacklists).where(eq(globalBlacklists.id, input.id));
      } else {
        await ctx.db.delete(baseBlacklists).where(eq(baseBlacklists.id, input.id));
      }
      return { success: true };
    }),

  // List blacklist words for a base (includes global)
  listBlacklist: baseOwnerProcedure
    .input(z.object({ baseId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      const globalWords = await ctx.db.select().from(globalBlacklists);

      let baseWords: typeof baseBlacklists.$inferSelect[] = [];
      if (input.baseId) {
        baseWords = await ctx.db
          .select()
          .from(baseBlacklists)
          .where(eq(baseBlacklists.baseId, input.baseId));
      }

      return {
        global: globalWords,
        base: baseWords,
      };
    }),
});
