import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { bases } from "./bases";

export const globalBlacklists = pgTable("global_blacklists", {
  id: uuid("id").defaultRandom().primaryKey(),
  word: varchar("word", { length: 128 }).notNull().unique(),
  category: varchar("category", { length: 32 }), // sara, kasar, spam
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const baseBlacklists = pgTable("base_blacklists", {
  id: uuid("id").defaultRandom().primaryKey(),
  baseId: uuid("base_id")
    .notNull()
    .references(() => bases.id, { onDelete: "cascade" }),
  word: varchar("word", { length: 128 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const baseBlacklistsRelations = relations(baseBlacklists, ({ one }) => ({
  base: one(bases, {
    fields: [baseBlacklists.baseId],
    references: [bases.id],
  }),
}));

export type GlobalBlacklist = typeof globalBlacklists.$inferSelect;
export type BaseBlacklist = typeof baseBlacklists.$inferSelect;
