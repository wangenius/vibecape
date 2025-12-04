/**
 * 全局聊天数据库
 * 存储与项目无关的 AI 对话历史
 * 位置: ~/vibecape/chat.db
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "path";
import * as chatSchema from "../../common/schema/chat";
import { ensureSchema } from "./ensure-schema";
import { getUserDataPaths } from "../services/UserData";

// 全局聊天数据库路径
const { vibecapeDir } = getUserDataPaths();
const chatPath = path.join(vibecapeDir, "chat.db");

const client = createClient({
  url: `file:${chatPath}`,
});

// 聊天数据库的 schema（包含关系）
const chatSchemaObj = chatSchema;

export const chatDb = drizzle(client, { schema: chatSchemaObj });
export const chatClient = client;

// 初始化聊天数据库
// 运行时从 schema 生成并执行 SQL
export async function initChatDatabase(): Promise<void> {
  try {
    // 启用外键约束
    await chatClient.execute(`PRAGMA foreign_keys = ON`);

    // 运行时从 schema 生成并执行建表 SQL
    await ensureSchema(chatClient, chatDb, chatSchema);

    console.log("聊天数据库初始化完成");
  } catch (error) {
    console.error("聊天数据库初始化失败:", error);
    throw error;
  }
}
