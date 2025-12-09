/**
 * 文档数据库表定义
 * 位置: {docs_root}/{workspace_id}/docs.db
 */

import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, jsonb, timestamp } from "./custom.type";
import type { JSONContent } from "@tiptap/core";

// ==================== Docs Schema ====================

/**
 * 文档表 - 存储 Tiptap JSONContent 格式的文档
 */
export const docs = sqliteTable(
  "docs",
  {
    /** 唯一 ID */
    id: id("id"),
    /** 父节点 ID (null 表示根节点) */
    parent_id: text("parent_id"),
    /** 显示标题 */
    title: text("title").notNull().default(""),
    /** Tiptap JSONContent 格式内容 */
    content: jsonb<JSONContent>()("content").notNull(),
    /** Frontmatter 元数据 (description, icon, full 等) */
    metadata: jsonb<Record<string, any>>()("metadata").notNull().default({}),
    /** 同级排序权重 (越小越靠前) */
    order: integer("order").notNull().default(0),
    /** 创建时间 */
    created_at: timestamp("created_at"),
    /** 更新时间 */
    updated_at: timestamp("updated_at"),
    /** 删除时间 (软删除) */
    deleted_at: integer("deleted_at", { mode: "number" }),
  },
  (table) => [
    index("docs_parent_idx").on(table.parent_id),
    index("docs_order_idx").on(table.parent_id, table.order),
  ]
);

/** 文档完整数据 (从 Drizzle schema 推导) */
export type Doc = typeof docs.$inferSelect;
/** 文档插入数据 */
export type DocInsert = typeof docs.$inferInsert;
/** 文档数据 (不含时间戳) */
export type DocData = Omit<Doc, "created_at" | "updated_at">;

// ==================== 派生类型 ====================

/**
 * 文档树节点 (用于前端展示，有子节点即为文件夹)
 */
export type DocTreeNode = Pick<Doc, "id" | "title" | "order" | "metadata"> & {
  children?: DocTreeNode[];
};
