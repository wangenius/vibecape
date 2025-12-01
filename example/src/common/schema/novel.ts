import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { id, jsonb, timestamp } from "./custom.type";
import { JSONContent } from "@tiptap/core";
// 作品主表
export const novels = sqliteTable("novels", {
  id: id("id"),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  cover: text("cover").notNull().default(""),
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
});

// 章节表
export const chapters = sqliteTable("chapters", {
  id: id("id"),
  novel_id: text("novel_id")
    .notNull()
    .references(() => novels.id, { onDelete: "cascade" }),
  story_id: text("story_id").notNull().default(""),
  name: text("name").notNull(),
  reasoner: text("reasoner").notNull().default(""),
  body: jsonb<JSONContent>()("body")
    .notNull()
    .$defaultFn(() => ({
      type: "doc",
      content: [{ type: "paragraph", content: [] }],
    })),
  order_index: integer("order_index", { mode: "number" }).notNull().default(0),
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
});

// ==================== Relations ====================

export const novelsRelations = relations(novels, ({ many }) => ({
  chapters: many(chapters),
}));

export const chaptersRelations = relations(chapters, ({ one }) => ({
  novel: one(novels, {
    fields: [chapters.novel_id],
    references: [novels.id],
  }),
}));

export type Novel = typeof novels.$inferSelect;
export type NovelInsert = typeof novels.$inferInsert;
export type Chapter = typeof chapters.$inferSelect;
export type ChapterInsert = typeof chapters.$inferInsert;
