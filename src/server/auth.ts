import NextAuth from "next-auth";
import Twitter from "next-auth/providers/twitter";
import { db } from "@/server/db";
import { users, wallets } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Twitter({
      clientId: process.env.X_CLIENT_ID!,
      clientSecret: process.env.X_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !profile) return false;

      const xId = account.providerAccountId;
      const xUsername = (profile as { data?: { username?: string } }).data?.username ?? profile.name ?? "";
      const xDisplayName = user.name ?? "";
      const xProfileImage = user.image ?? "";

      // Upsert user
      const existingUser = await db.query.users.findFirst({
        where: eq(users.xId, xId),
      });

      if (existingUser) {
        await db
          .update(users)
          .set({
            xUsername,
            xDisplayName,
            xProfileImage,
            xAccessToken: account.access_token ?? null,
            xRefreshToken: account.refresh_token ?? null,
            updatedAt: new Date(),
          })
          .where(eq(users.xId, xId));
      } else {
        const [newUser] = await db
          .insert(users)
          .values({
            xId,
            xUsername,
            xDisplayName,
            xProfileImage,
            xAccessToken: account.access_token ?? null,
            xRefreshToken: account.refresh_token ?? null,
            role: "sender",
          })
          .returning();

        // Create wallet for new user
        if (newUser) {
          await db.insert(wallets).values({
            userId: newUser.id,
            balance: 0,
          });
        }
      }

      return true;
    },

    async jwt({ token, account, profile }) {
      if (account) {
        const xId = account.providerAccountId;
        const dbUser = await db.query.users.findFirst({
          where: eq(users.xId, xId),
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
          token.xUsername = dbUser.xUsername;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        (session.user as { id?: string }).id = token.userId as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { xUsername?: string }).xUsername = token.xUsername as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
  },
});
