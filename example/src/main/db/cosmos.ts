import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import fs from "fs";
import path from "path";
import * as cosmosSchema from "../../common/schema/cosmos_bodies";
import * as novelSchema from "../../common/schema/novel";
import { ensureSchema } from "./ensure-schema";
import { BroadcastingLogger } from "./BroadcastingLogger";

// 合并 cosmos 和 novel 的 schema
const fullCosmosSchema = {
  ...cosmosSchema,
  ...novelSchema,
};

// 项目数据库连接池
const cosmosDatabases = new Map<string, ReturnType<typeof drizzle>>();
const cosmosClients = new Map<string, ReturnType<typeof createClient>>();

/**
 * 获取项目数据库路径
 */
export function getCosmosDbPath(cosmosId: string): string {
  return path.join(process.cwd(), "data", cosmosId, "data.db");
}

/**
 * 获取项目目录路径
 */
export function getCosmosDir(cosmosId: string): string {
  return path.join(process.cwd(), "data", cosmosId);
}

/**
 * 获取项目资源目录路径
 */
export function getCosmosAssetsDir(cosmosId: string): string {
  return path.join(getCosmosDir(cosmosId), "assets");
}

/**
 * 获取或创建项目数据库连接
 */
export function getCosmosDb(cosmosId: string) {
  if (cosmosDatabases.has(cosmosId)) {
    return cosmosDatabases.get(cosmosId)!;
  }

  const dbPath = getCosmosDbPath(cosmosId);
  const cosmosDir = getCosmosDir(cosmosId);
  const assetsDir = getCosmosAssetsDir(cosmosId);

  // 确保目录存在
  fs.mkdirSync(cosmosDir, { recursive: true });
  fs.mkdirSync(assetsDir, { recursive: true });

  const client = createClient({
    url: `file:${dbPath}`,
  });

  const logger = new BroadcastingLogger(cosmosId);
  const db = drizzle(client, { schema: fullCosmosSchema, logger });

  cosmosDatabases.set(cosmosId, db);
  cosmosClients.set(cosmosId, client);

  return db;
}

/**
 * 获取项目数据库客户端
 */
export function getCosmosClient(cosmosId: string) {
  if (!cosmosClients.has(cosmosId)) {
    getCosmosDb(cosmosId); // 这会创建客户端
  }
  return cosmosClients.get(cosmosId)!;
}

/**
 * 初始化项目数据库
 * 运行时从 schema 生成并执行 SQL
 */
export async function initCosmosDatabase(cosmosId: string) {
  const db = getCosmosDb(cosmosId);
  const client = getCosmosClient(cosmosId);

  try {
    // 运行时从 schema 生成并执行建表 SQL（包括 cosmos 和 novel 的表）
    await ensureSchema(client, db, fullCosmosSchema);

    console.log(`项目 ${cosmosId} 数据库初始化完成`);
  } catch (error) {
    console.error(`项目 ${cosmosId} 数据库初始化失败:`, error);
    throw error;
  }
}

/**
 * 关闭项目数据库连接
 */
export function closeCosmosDb(cosmosId: string) {
  const client = cosmosClients.get(cosmosId);
  if (client) {
    client.close();
    cosmosClients.delete(cosmosId);
    cosmosDatabases.delete(cosmosId);
  }
}

/**
 * 关闭所有项目数据库连接
 */
export function closeAllCosmosDbs() {
  for (const [cosmosId] of cosmosClients) {
    closeCosmosDb(cosmosId);
  }
}
