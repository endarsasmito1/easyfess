import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const bases = pgTable("bases", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  displayName: varchar("display_name", { length: 128 }).notNull(),
  description: text("description"),
  rulesHtml: text("rules_html"),
  triggerWord: varchar("trigger_word", { length: 64 }).notNull(),
  xAccessTokenEnc: text("x_access_token_enc"),
  xAccessSecretEnc: text("x_access_secret_enc"),
  xBaseUsername: varchar("x_base_username", { length: 64 }),
  isActive: boolean("is_active").notNull().default(false),
  cooldownUntil: timestamp("cooldown_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const basesRelations = relations(bases, ({ one }) => ({
  owner: one(users, {
    fields: [bases.ownerId],
    references: [users.id],
  }),
}));

export type Base = typeof bases.$inferSelect;
export type NewBase = typeof bases.$inferInsert;
