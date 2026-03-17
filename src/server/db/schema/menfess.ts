import { pgTable, uuid, text, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { bases } from "./bases";

export const menfessStatusEnum = pgEnum("menfess_status", [
  "queued",
  "processing",
  "posted",
  "failed",
  "rejected",
]);

export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

export const menfess = pgTable("menfess", {
  id: uuid("id").defaultRandom().primaryKey(),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  baseId: uuid("base_id")
    .notNull()
    .references(() => bases.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  status: menfessStatusEnum("status").notNull().default("queued"),
  postedTweetId: varchar("posted_tweet_id", { length: 64 }),
  postedTweetUrl: text("posted_tweet_url"),
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").notNull().default(0),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const menfessMedia = pgTable("menfess_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  menfessId: uuid("menfess_id")
    .notNull()
    .references(() => menfess.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  type: mediaTypeEnum("type").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const menfessRelations = relations(menfess, ({ one, many }) => ({
  sender: one(users, {
    fields: [menfess.senderId],
    references: [users.id],
  }),
  base: one(bases, {
    fields: [menfess.baseId],
    references: [bases.id],
  }),
  media: many(menfessMedia),
}));

export const menfessMediaRelations = relations(menfessMedia, ({ one }) => ({
  menfess: one(menfess, {
    fields: [menfessMedia.menfessId],
    references: [menfess.id],
  }),
}));

export type Menfess = typeof menfess.$inferSelect;
export type NewMenfess = typeof menfess.$inferInsert;
export type MenfessMedia = typeof menfessMedia.$inferSelect;
export type NewMenfessMedia = typeof menfessMedia.$inferInsert;
