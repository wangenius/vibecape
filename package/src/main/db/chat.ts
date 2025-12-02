import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import fs from "fs";
import path from "path";
import os from "os";
import * as chatSchema from "../../common/schema/chat";
import { ensureSchema } from "./ensure-schema";

// 全局聊天数据库路径 - 存储到用户目录 ~/.vibecape/
const vibecapeDir = path.join(os.homedir(), ".vibecape");
const chatPath = path.join(vibecapeDir, "chat.db");
fs.mkdirSync(vibecapeDir, { recursive: true });

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
