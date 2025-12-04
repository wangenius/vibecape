/**
 * AI 配置数据库
 * 存储 providers 和 models
 * 位置: ~/vibecape/app.db
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { models, providers } from "@common/schema/app";
import { ensureSchema } from "./ensure-schema";
import { getUserDataPaths, initUserDataDir } from "../services/UserData";
import path from "path";

// 初始化用户数据目录
initUserDataDir();

// AI 配置数据库路径
const { vibecapeDir } = getUserDataPaths();
const appDbPath = path.join(vibecapeDir, "app.db");

const client = createClient({
  url: `file:${appDbPath}`,
});

// AI 配置数据库 schema (仅 providers 和 models)
const appSchema = {
  models,
  providers,
};

export const appDb = drizzle(client, { schema: appSchema });
export const appClient = client;

/**
 * 初始化 AI 配置数据库
 * 仅创建 providers 和 models 表
 */
export async function initAppDatabase(): Promise<void> {
  try {
    await ensureSchema(appClient, appDb, {
      models,
      providers,
    });
    console.log("[AppDB] AI 配置数据库初始化完成");
  } catch (error) {
    console.error("[AppDB] AI 配置数据库初始化失败:", error);
    throw error;
  }
}
