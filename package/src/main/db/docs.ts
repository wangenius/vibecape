/**
 * 文档数据库客户端
 * 支持动态路径的 SQLite 数据库
 * 位置: {docs_root}/{repository_id}/docs.db
 */

import { createClient, Client } from "@libsql/client";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import fs from "fs";
import path from "path";
import { docs } from "@common/schema/docs";

// 文档数据库 schema
const docsSchema = {
  docs,
};

// 缓存已打开的数据库连接
const dbCache = new Map<string, { client: Client; db: LibSQLDatabase<typeof docsSchema> }>();

/**
 * 确保 docs 数据库 schema 存在
 */
async function ensureDocsSchema(client: Client): Promise<void> {
  const sqls = [
    `CREATE TABLE IF NOT EXISTS docs (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER
    );`,
    `CREATE INDEX IF NOT EXISTS docs_parent_idx ON docs(parent_id);`,
    `CREATE INDEX IF NOT EXISTS docs_order_idx ON docs(parent_id, "order");`,
  ];

  for (const sql of sqls) {
    await client.execute(sql);
  }

  // 尝试添加 deleted_at 列 (如果是旧数据库)
  try {
    await client.execute(`ALTER TABLE docs ADD COLUMN deleted_at INTEGER;`);
  } catch (e) {
    // 忽略错误 (列已存在)
  }
}

/**
 * 获取或创建文档数据库连接
 * @param dbPath 数据库文件路径
 */
export async function getDocsDb(dbPath: string): Promise<LibSQLDatabase<typeof docsSchema>> {
  // 检查缓存
  const cached = dbCache.get(dbPath);
  if (cached) {
    return cached.db;
  }

  // 确保目录存在
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 创建客户端
  const client = createClient({
    url: `file:${dbPath}`,
  });

  const db = drizzle(client, { schema: docsSchema });

  // 初始化 schema
  await ensureDocsSchema(client);

  // 缓存连接
  dbCache.set(dbPath, { client, db });

  console.log("[DocsDB] Connected to:", dbPath);
  return db;
}

/**
 * 关闭数据库连接
 * @param dbPath 数据库文件路径
 */
export function closeDocsDb(dbPath: string): void {
  const cached = dbCache.get(dbPath);
  if (cached) {
    cached.client.close();
    dbCache.delete(dbPath);
    console.log("[DocsDB] Closed:", dbPath);
  }
}

/**
 * 关闭所有数据库连接
 */
export function closeAllDocsDb(): void {
  for (const [dbPath, { client }] of dbCache) {
    client.close();
    dbCache.delete(dbPath);
  }
  console.log("[DocsDB] Closed all connections");
}
