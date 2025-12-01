// db/init.ts
import { initSettingsDatabase } from "./app";
import { initChatDatabase } from "./chat";

// 可重试 + 去副作用 + 去并发抖动
let initPromise: Promise<void> | undefined;

export function ensureDatabaseReady(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      // 初始化设置数据库、元数据数据库和聊天数据库
      await Promise.all([initSettingsDatabase(), initChatDatabase()]);
    })().catch((err) => {
      // 关键：失败不缓存，以便后续可重试
      initPromise = undefined;
      throw err;
    });
  }
  return initPromise;
}
