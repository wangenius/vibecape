import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Client } from "@libsql/client";
import { runMigrations, getMigrationStatus } from "./migrations";

/**
 * 确保数据库 Schema 已就绪
 * 使用版本化迁移系统
 */
export async function ensureSchema(
  client: Client,
  _db: LibSQLDatabase<any>,
  _schema: Record<string, any>
): Promise<void> {
  // 运行迁移
  await runMigrations(client);

  // 打印迁移状态
  const status = await getMigrationStatus(client);
  console.log(
    `[Schema] Database version: ${status.current}, Latest: ${status.latest}`
  );
}

// 保持 API 兼容
export async function pushSchema(
  client: LibSQLDatabase<any>,
  schema: Record<string, any>
): Promise<void> {
  await ensureSchema(client as unknown as Client, client, schema);
}
