/**
 * 数据库迁移系统
 * 支持版本化迁移、回滚追踪
 */

import type { Client } from "@libsql/client";

interface Migration {
  version: number;
  name: string;
  up: string[];
  down?: string[];
}

/**
 * 迁移定义
 * 新增迁移请在此数组末尾添加，version 递增
 */
const migrations: Migration[] = [
  {
    version: 1,
    name: "create_providers_table",
    up: [
      `CREATE TABLE IF NOT EXISTS providers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        base_url TEXT NOT NULL,
        api_key TEXT NOT NULL,
        models_path TEXT NOT NULL DEFAULT '/models',
        enabled INTEGER NOT NULL DEFAULT 1
      );`,
    ],
    down: [`DROP TABLE IF EXISTS providers;`],
  },
  {
    version: 2,
    name: "create_models_table",
    up: [
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
    ],
    down: [`DROP TABLE IF EXISTS models;`],
  },
  {
    version: 3,
    name: "create_settings_table",
    up: [
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );`,
    ],
    down: [`DROP TABLE IF EXISTS settings;`],
  },
  {
    version: 4,
    name: "create_chat_tables",
    up: [
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
    ],
    down: [
      `DROP INDEX IF EXISTS idx_chat_messages_thread;`,
      `DROP TABLE IF EXISTS chat_messages;`,
      `DROP TABLE IF EXISTS chat_threads;`,
    ],
  },
  {
    version: 5,
    name: "enable_foreign_keys",
    up: [`PRAGMA foreign_keys = ON;`],
    down: [`PRAGMA foreign_keys = OFF;`],
  },
];

/**
 * 创建迁移记录表
 */
async function ensureMigrationsTable(client: Client): Promise<void> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `);
}

/**
 * 获取已执行的迁移版本
 */
async function getAppliedVersions(client: Client): Promise<Set<number>> {
  const result = await client.execute("SELECT version FROM _migrations");
  return new Set(result.rows.map((r) => r.version as number));
}

/**
 * 记录迁移已执行
 */
async function recordMigration(
  client: Client,
  version: number,
  name: string
): Promise<void> {
  await client.execute({
    sql: "INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)",
    args: [version, name, Date.now()],
  });
}

/**
 * 执行迁移
 */
export async function runMigrations(client: Client): Promise<void> {
  await ensureMigrationsTable(client);

  const appliedVersions = await getAppliedVersions(client);

  // 找出待执行的迁移
  const pendingMigrations = migrations.filter(
    (m) => !appliedVersions.has(m.version)
  );

  if (pendingMigrations.length === 0) {
    console.log("[Migration] No pending migrations");
    return;
  }

  console.log(`[Migration] Running ${pendingMigrations.length} migrations...`);

  for (const migration of pendingMigrations) {
    console.log(
      `[Migration] Applying: v${migration.version} - ${migration.name}`
    );

    try {
      for (const sql of migration.up) {
        await client.execute(sql);
      }
      await recordMigration(client, migration.version, migration.name);
      console.log(`[Migration] Applied: v${migration.version}`);
    } catch (error: any) {
      // 对于某些幂等操作，忽略特定错误
      const ignorableErrors = [
        "table already exists",
        "duplicate column",
        "index already exists",
      ];

      const isIgnorable = ignorableErrors.some((msg) =>
        error?.message?.toLowerCase().includes(msg)
      );

      if (isIgnorable) {
        console.log(
          `[Migration] Skipped (already applied): v${migration.version}`
        );
        await recordMigration(client, migration.version, migration.name);
        continue;
      }

      console.error(
        `[Migration] Failed: v${migration.version} - ${migration.name}`,
        error
      );
      throw error;
    }
  }

  console.log("[Migration] All migrations completed");
}

/**
 * 获取当前数据库版本
 */
export async function getCurrentVersion(client: Client): Promise<number> {
  try {
    const result = await client.execute(
      "SELECT MAX(version) as version FROM _migrations"
    );
    return (result.rows[0]?.version as number) ?? 0;
  } catch {
    return 0;
  }
}

/**
 * 获取迁移状态
 */
export async function getMigrationStatus(client: Client): Promise<{
  current: number;
  latest: number;
  pending: number;
}> {
  const current = await getCurrentVersion(client);
  const latest = migrations.length > 0 ? migrations[migrations.length - 1].version : 0;
  const applied = await getAppliedVersions(client);
  const pending = migrations.filter((m) => !applied.has(m.version)).length;

  return { current, latest, pending };
}
