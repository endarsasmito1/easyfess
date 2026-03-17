import { pgTable, uuid, varchar, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["sender", "base_owner", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  xId: varchar("x_id", { length: 64 }).notNull().unique(),
  xUsername: varchar("x_username", { length: 64 }).notNull(),
  xDisplayName: varchar("x_display_name", { length: 128 }),
  xProfileImage: text("x_profile_image"),
  xAccessToken: text("x_access_token"),
  xRefreshToken: text("x_refresh_token"),
  role: userRoleEnum("role").notNull().default("sender"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
