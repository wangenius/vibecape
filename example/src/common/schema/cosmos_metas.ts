import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { id, jsonb, timestamp } from "./custom.type";
import { JSONContent } from "@tiptap/core";

// 世界观元数据表（单一数据源）
export const cosmos_metas = sqliteTable("cosmos_metas", {
  id: id(),
  name: text("name").notNull().default(""),
  author: text("author").notNull().default(""),
  description: jsonb<JSONContent>()("description")
    .notNull()
    .$defaultFn(() => ({
      type: "doc",
      content: [{ type: "paragraph", content: [] }],
    })),
  cover: text("cover").notNull().default(""),
  tags: jsonb<string[]>()("tags")
    .notNull()
    .$defaultFn(() => []),
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
  last_opened_at: timestamp("last_opened_at"),
});

/**
 * 世界观元数据类型
 */
export type CosmosMeta = typeof cosmos_metas.$inferSelect;
/**
 * 世界观元数据插入类型
 */
export type CosmosMetaInsert = typeof cosmos_metas.$inferInsert;
