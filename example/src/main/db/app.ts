import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import fs from "fs";
import path from "path";
import { models, settings, writingStyle } from "@common/schema/app";
import { SETTINGS_DEFAULTS } from "@common/config/settings";
import { ensureSchema } from "./ensure-schema";

// 全局设置数据库路径
const settingsPath = path.join(process.cwd(), "data", "app.db");
fs.mkdirSync(path.dirname(settingsPath), { recursive: true });

const client = createClient({
  url: `file:${settingsPath}`,
});

// 设置数据库的 schema
const appSchema = {
  models,
  settings,
  writingStyle,
};

export const appDb = drizzle(client, { schema: appSchema });
export const settingsClient = client;

// 默认设置
export const DEFAULT_SETTINGS = SETTINGS_DEFAULTS;

// 初始化设置数据库
// 1. 运行时从 schema 生成并执行 SQL（使用 drizzle-kit/api）
// 2. 初始化默认数据
export async function initSettingsDatabase(): Promise<void> {
  try {
    // 运行时从 schema 生成并执行建表 SQL
    await ensureSchema(settingsClient, appDb, {
      models,
      settings,
      writingStyle,
    });

    // 初始化默认设置
    const existingSettings = await appDb.select().from(settings).execute();

    if (existingSettings.length === 0) {
      await appDb
        .insert(settings)
        .values({
          key: "app_settings",
          value: DEFAULT_SETTINGS,
        })
        .execute();
    }

    // 初始化默认小说写作风格
    const existingStyles = await appDb.select().from(writingStyle).execute();

    if (existingStyles.length === 0) {
      const now = Date.now();
      await appDb
        .insert(writingStyle)
        .values({
          id: "default",
          name: "默认风格",
          description:
            "多分段!多用对话描写!用对话去推进剧情发展!!非环境描写必须控制段落长度!",
          example: null,
          created_at: now,
          updated_at: now,
        })
        .execute();
    }

    console.log("设置数据库初始化完成");
  } catch (error) {
    console.error("设置数据库初始化失败:", error);
    throw error;
  }
}
