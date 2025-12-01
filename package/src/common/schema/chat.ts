import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { UIMessage } from "ai";
import { id, jsonb, timestamp } from "./custom.type";

// UIMessagePart 类型
type UIMessagePart = UIMessage["parts"][number];

// ==================== 聊天 ====================

export const chatThreads = sqliteTable("chat_threads", {
  id: id("id", { length: 24 }),
  title: text("title").notNull().default(""),
  metadata: jsonb<Record<string, any>>()("metadata")
    .notNull()
    .$defaultFn(() => ({})),
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: id("id", { length: 24 }),
  thread_id: text("thread_id")
    .notNull()
    .references(() => chatThreads.id, { onDelete: "cascade" }),
  role: text("role").$type<"user" | "assistant" | "system">().notNull(),
  parts: jsonb<UIMessagePart[]>()("parts")
    .notNull()
    .$defaultFn(() => []),
  sequence: integer("sequence", { mode: "number" }).notNull().default(0),
  metadata: jsonb<Record<string, any>>()("metadata")
    .notNull()
    .$defaultFn(() => ({})),
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
});

// ==================== Relations ====================

export const chatThreadsRelations = relations(chatThreads, ({ many }) => ({
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  thread: one(chatThreads, {
    fields: [chatMessages.thread_id],
    references: [chatThreads.id],
  }),
}));

// ==================== Types ====================

export type ChatThreadMeta = typeof chatThreads.$inferSelect;
export type ChatThreadMetaInsert = typeof chatThreads.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ChatMessageInsert = typeof chatMessages.$inferInsert;

export type ChatThread = ChatThreadMeta & {
  messages: ChatMessage[];
};
