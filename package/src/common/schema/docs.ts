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
    /** 文档名称 (用于生成文件名，如 "getting-started") */
    slug: text("slug").notNull(),
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
  },
  (table) => [
    index("docs_parent_idx").on(table.parent_id),
    index("docs_order_idx").on(table.parent_id, table.order),
  ]
);

export type Doc = typeof docs.$inferSelect;
export type DocInsert = typeof docs.$inferInsert;

/**
 * 工作区设置表 - 存储 vibecape 工作区配置
 */
export const workspace_settings = sqliteTable("workspace_settings", {
  /** 设置键 */
  key: text("key").primaryKey(),
  /** 设置值 (JSON) */
  value: jsonb<any>()("value").notNull(),
});

export type WorkspaceSetting = typeof workspace_settings.$inferSelect;
export type WorkspaceSettingInsert = typeof workspace_settings.$inferInsert;

// ==================== Types ====================

/**
 * 文档树节点 (用于前端展示，有子节点即为文件夹)
 */
export type DocTreeNode = {
  id: string;
  slug: string;
  title: string;
  order: number;
  children?: DocTreeNode[];
  metadata?: Record<string, any>;
};

/**
 * 完整文档数据 (包含内容)
 */
export type DocData = {
  id: string;
  parent_id: string | null;
  slug: string;
  title: string;
  content: JSONContent;
  metadata: Record<string, any>;
  order: number;
};

/**
 * Vibecape 工作区信息
 * 
 * 目录结构:
 * /path/to/docs/           <- root (用户选择的 docs 目录)
 *   .vibecape/             <- vibecapePath
 *     docs.db              <- dbPath
 *   getting-started.mdx
 *   guides/
 *     ...
 */
export type VibecapeWorkspace = {
  /** docs 目录路径 (用户选择的目录，包含 .vibecape) */
  root: string;
  /** .vibecape 目录路径 */
  vibecapePath: string;
  /** 数据库路径 */
  dbPath: string;
  /** docs 目录路径 (与 root 相同，用于同步) */
  docsPath: string;
  /** 工作区是否已初始化 */
  initialized: boolean;
};
