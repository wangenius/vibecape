/**
 * 运行时从 Drizzle Schema 生成并执行 SQL
 * 使用 drizzle-kit/api 的内部 API
 */

import {
  generateSQLiteDrizzleJson,
  generateSQLiteMigration,
} from "drizzle-kit/api";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Client } from "@libsql/client";

/**
 * 确保数据库 schema 存在
 * 从 schema 对象生成 CREATE TABLE 等 SQL 并执行
 *
 * @param client - libsql client
 * @param _db - drizzle database instance (仅用于类型推断，实际使用 client 执行)
 * @param schema - schema 对象（从 common/schema 导入）
 */
export async function ensureSchema(
  client: Client,
  _db: LibSQLDatabase<any>,
  schema: Record<string, any>
): Promise<void> {
  try {
    // 从空快照到当前 schema 生成迁移 SQL
    const emptySnapshot = await generateSQLiteDrizzleJson({});
    const currentSnapshot = await generateSQLiteDrizzleJson(schema);
    const sqls = await generateSQLiteMigration(emptySnapshot, currentSnapshot);

    // 逐条执行 SQL（将 CREATE TABLE 转为 IF NOT EXISTS 避免重复创建）
    for (let sql of sqls) {
      // 确保是幂等操作：CREATE TABLE -> CREATE TABLE IF NOT EXISTS
      if (sql.trim().toUpperCase().startsWith("CREATE TABLE")) {
        sql = sql.replace(/CREATE TABLE\s+/i, "CREATE TABLE IF NOT EXISTS ");
      }
      
      // 确保索引创建也是幂等的
      if (sql.trim().toUpperCase().startsWith("CREATE UNIQUE INDEX")) {
        sql = sql.replace(/CREATE UNIQUE INDEX\s+/i, "CREATE UNIQUE INDEX IF NOT EXISTS ");
      } else if (sql.trim().toUpperCase().startsWith("CREATE INDEX")) {
        sql = sql.replace(/CREATE INDEX\s+/i, "CREATE INDEX IF NOT EXISTS ");
      }
      
      await client.execute(sql);
    }
  } catch (error) {
    console.error("Schema 初始化失败:", error);
    throw error;
  }
}

/**
 * 使用 push 方式直接同步 schema（更简单但不生成 SQL）
 * 注意：这个方法会自动对比并执行变更
 */
export async function pushSchema(
  db: LibSQLDatabase<any>,
  schema: Record<string, any>
): Promise<void> {
  try {
    // 这个 API 可能在某些版本不可用，需要测试
    const { pushSQLiteSchema } = await import("drizzle-kit/api");
    const { apply } = await pushSQLiteSchema(schema, db);
    await apply();
  } catch (error) {
    console.error("Schema push 失败，回退到 generate 方式:", error);
    throw error;
  }
}
