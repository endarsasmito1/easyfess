import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  baseOwnerProcedure,
  publicProcedure,
} from "@/server/trpc/trpc";
import { bases, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/server/services/encryption";
import { slugify } from "@/server/lib/utils";
import { TRPCError } from "@trpc/server";

export const baseRouter = createTRPCRouter({
  // Create a new base
  create: protectedProcedure
    .input(
      z.object({
        slug: z
          .string()
          .min(3)
          .max(32)
          .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip"),
        displayName: z.string().min(1).max(128),
        triggerWord: z.string().min(1).max(64),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;

      // Check if slug is already taken
      const existing = await ctx.db.query.bases.findFirst({
        where: eq(bases.slug, input.slug),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Slug sudah digunakan. Pilih nama lain.",
        });
      }

      // Upgrade user role to base_owner if still sender
      const userRole = (ctx.session.user as { role?: string }).role;
      if (userRole === "sender") {
        await ctx.db
          .update(users)
          .set({ role: "base_owner", updatedAt: new Date() })
          .where(eq(users.id, userId));
      }

      const [newBase] = await ctx.db
        .insert(bases)
        .values({
          ownerId: userId,
          slug: input.slug,
          displayName: input.displayName,
          triggerWord: input.triggerWord,
          description: input.description,
          isActive: false, // Not active until X account is linked
        })
        .returning();

      return newBase;
    }),

  // Update base settings
  update: baseOwnerProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        displayName: z.string().min(1).max(128).optional(),
        triggerWord: z.string().min(1).max(64).optional(),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;
      const { id, ...updateData } = input;

      const base = await ctx.db.query.bases.findFirst({
        where: eq(bases.id, id),
      });

      if (!base || base.ownerId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Bukan pemilik base ini" });
      }

      const [updated] = await ctx.db
        .update(bases)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(bases.id, id))
        .returning();

      return updated;
    }),

  // Update rules (rich text HTML)
  updateRules: baseOwnerProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        rulesHtml: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;

      const base = await ctx.db.query.bases.findFirst({
        where: eq(bases.id, input.id),
      });

      if (!base || base.ownerId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Bukan pemilik base ini" });
      }

      await ctx.db
        .update(bases)
        .set({ rulesHtml: input.rulesHtml, updatedAt: new Date() })
        .where(eq(bases.id, input.id));

      return { success: true };
    }),

  // Get base by slug (public - for rules page)
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const base = await ctx.db.query.bases.findFirst({
        where: eq(bases.slug, input.slug),
        columns: {
          id: true,
          slug: true,
          displayName: true,
          description: true,
          rulesHtml: true,
          triggerWord: true,
          xBaseUsername: true,
          isActive: true,
        },
      });

      if (!base) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Base tidak ditemukan" });
      }

      return base;
    }),

  // List bases owned by current user
  listOwned: baseOwnerProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session.user as { id: string }).id;

    return ctx.db.query.bases.findMany({
      where: eq(bases.ownerId, userId),
      orderBy: (bases, { desc }) => [desc(bases.createdAt)],
    });
  }),

  // List all active bases (for sender dropdown)
  listActive: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.bases.findMany({
      where: eq(bases.isActive, true),
      columns: {
        id: true,
        slug: true,
        displayName: true,
        triggerWord: true,
        xBaseUsername: true,
      },
      orderBy: (bases, { asc }) => [asc(bases.displayName)],
    });
  }),

  // Link X account to base (save encrypted tokens)
  linkXAccount: baseOwnerProcedure
    .input(
      z.object({
        baseId: z.string().uuid(),
        accessToken: z.string(),
        accessSecret: z.string(),
        xBaseUsername: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session.user as { id: string }).id;

      const base = await ctx.db.query.bases.findFirst({
        where: eq(bases.id, input.baseId),
      });

      if (!base || base.ownerId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Bukan pemilik base ini" });
      }

      // Encrypt tokens before storing
      const encryptedToken = encrypt(input.accessToken);
      const encryptedSecret = encrypt(input.accessSecret);

      await ctx.db
        .update(bases)
        .set({
          xAccessTokenEnc: encryptedToken,
          xAccessSecretEnc: encryptedSecret,
          xBaseUsername: input.xBaseUsername,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(bases.id, input.baseId));

      return { success: true, message: "Akun X berhasil ditautkan!" };
    }),

  // Get base status (active/cooldown)
  getStatus: baseOwnerProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const base = await ctx.db.query.bases.findFirst({
        where: eq(bases.id, input.id),
        columns: {
          isActive: true,
          cooldownUntil: true,
          xBaseUsername: true,
        },
      });

      if (!base) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const inCooldown = base.cooldownUntil
        ? new Date(base.cooldownUntil) > new Date()
        : false;

      return {
        isActive: base.isActive,
        inCooldown,
        cooldownUntil: base.cooldownUntil,
        xBaseUsername: base.xBaseUsername,
      };
    }),
});
