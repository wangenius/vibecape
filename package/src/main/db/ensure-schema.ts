import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Client } from "@libsql/client";

/**
 * 运行时快速创建所需表，避免 drizzle-kit 在运行时动态 import package.json
 * （Node 20+ 需要 JSON import attributes，直接用 SQL 创建最简单可靠）
 */
export async function ensureSchema(
  client: Client,
  _db: LibSQLDatabase<any>,
  _schema: Record<string, any>
): Promise<void> {
  const sqls = [
    // Providers 表
    `CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      api_key TEXT NOT NULL,
      models_path TEXT NOT NULL DEFAULT '/models',
      enabled INTEGER NOT NULL DEFAULT 1
    );`,
    // Models 表
    `CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL,
      provider_id TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'text',
      json INTEGER NOT NULL DEFAULT 0,
      reasoner INTEGER NOT NULL DEFAULT 0
    );`,
    // 迁移：从 models 表移除 api_key 和 base_url 列（如果存在）
    `ALTER TABLE models DROP COLUMN api_key;`,
    `ALTER TABLE models DROP COLUMN base_url;`,
    // Settings 表
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS chat_threads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER,
      updated_at INTEGER
    );`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      role TEXT NOT NULL,
      parts TEXT NOT NULL DEFAULT '[]',
      sequence INTEGER NOT NULL DEFAULT 0,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY(thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id);`,
    `PRAGMA foreign_keys = ON;`,
  ];

  for (const sql of sqls) {
    try {
      await client.execute(sql);
    } catch (error: any) {
      // 忽略 "duplicate column" 错误（ALTER TABLE 添加已存在的列）
      if (error?.message?.includes("duplicate column")) {
        continue;
      }
      // 忽略 "no such column" 错误（DROP COLUMN 时列不存在）
      if (error?.message?.includes("no such column")) {
        continue;
      }
      throw error;
    }
  }
}

// 保持 API 兼容
export async function pushSchema(
  client: LibSQLDatabase<any>,
  schema: Record<string, any>
): Promise<void> {
  await ensureSchema(client as unknown as Client, client, schema);
}
