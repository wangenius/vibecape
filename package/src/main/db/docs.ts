/**
 * Vibecape 文档数据库客户端
 * 支持动态路径的 SQLite 数据库
 */

import { createClient, Client } from "@libsql/client";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import fs from "fs";
import path from "path";
import {
  docs,
  workspace_settings,
  type VibecapeWorkspace,
  WORKSPACE_DIR_NAME,
  LEGACY_WORKSPACE_DIR_NAME,
  DEFAULT_WORKSPACE_CONFIG,
} from "@common/schema/docs";

// 文档数据库 schema
const docsSchema = {
  docs,
  workspace_settings,
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
    `CREATE TABLE IF NOT EXISTS workspace_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );`,
  ];

  for (const sql of sqls) {
    await client.execute(sql);
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
}

function buildWorkspacePaths(
  docsDir: string,
  vibecapePath: string
): Omit<VibecapeWorkspace, "initialized" | "config"> {
  return {
    root: docsDir,
    vibecapePath,
    dbPath: path.join(vibecapePath, "docs.db"),
    configPath: path.join(vibecapePath, "configs.json"),
    docsPath: docsDir,
  };
}

function resolveWorkspaceDir(docsDir: string): string {
  const preferred = path.join(docsDir, WORKSPACE_DIR_NAME);
  const legacy = path.join(docsDir, LEGACY_WORKSPACE_DIR_NAME);

  if (fs.existsSync(preferred)) return preferred;
  if (fs.existsSync(legacy)) return legacy;
  return preferred;
}

/**
 * 获取 vibecape 工作区路径信息
 * @param docsDir 文档目录 (vibecape 将在此目录内创建)
 */
export function getVibecapePaths(docsDir: string): Omit<VibecapeWorkspace, "initialized"> {
  const vibecapePath = resolveWorkspaceDir(docsDir);
  return buildWorkspacePaths(docsDir, vibecapePath);
}

/**
 * 获取完整工作区信息
 * @param targetDir 目标目录
 */
export function getWorkspaceInfo(targetDir: string): VibecapeWorkspace {
  const paths = getVibecapePaths(targetDir);
  return {
    ...paths,
    initialized: fs.existsSync(paths.dbPath),
  };
}

/**
 * 检查 vibecape 工作区是否存在
 * @param targetDir 目标目录
 */
export function isVibecapeWorkspace(targetDir: string): boolean {
  const { dbPath } = getVibecapePaths(targetDir);
  return fs.existsSync(dbPath);
}

/**
 * 初始化 vibecape 工作区
 * @param docsDir docs 目录 (vibecape 将在其内部创建)
 */
export async function initVibecapeWorkspace(docsDir: string): Promise<{
  db: LibSQLDatabase<typeof docsSchema>;
  workspace: VibecapeWorkspace;
}> {
  const preferred = path.join(docsDir, WORKSPACE_DIR_NAME);
  const legacy = path.join(docsDir, LEGACY_WORKSPACE_DIR_NAME);
  let vibecapePath = preferred;

  // 迁移旧的 .vibecape 目录
  if (!fs.existsSync(preferred) && fs.existsSync(legacy)) {
    try {
      fs.renameSync(legacy, preferred);
      vibecapePath = preferred;
    } catch (error) {
      console.warn("[initVibecapeWorkspace] Failed to migrate legacy .vibecape, fallback to legacy path:", error);
      vibecapePath = legacy;
    }
  }

  const paths = buildWorkspacePaths(docsDir, vibecapePath);

  // 创建 vibecape 目录
  if (!fs.existsSync(vibecapePath)) {
    fs.mkdirSync(vibecapePath, { recursive: true });
  }

  // 创建 .gitignore 文件
  const gitignorePath = path.join(vibecapePath, ".gitignore");
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, "*.db\n*.db-journal\n*.db-wal\n*.db-shm\n");
  }

  // 创建默认配置文件
  if (!fs.existsSync(paths.configPath)) {
    fs.writeFileSync(
      paths.configPath,
      JSON.stringify(DEFAULT_WORKSPACE_CONFIG, null, 2),
      "utf-8"
    );
  }

  // 初始化数据库
  const db = await getDocsDb(paths.dbPath);
  
  return {
    db,
    workspace: { ...paths, initialized: true },
  };
}
