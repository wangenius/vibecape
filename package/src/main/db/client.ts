/**
 * 数据库初始化
 * 初始化 app.db 和 chat.db
 */

import { initAppDatabase } from "./app";
import { initChatDatabase } from "./chat";

let initPromise: Promise<void> | undefined;

export function ensureDatabaseReady(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await Promise.all([initAppDatabase(), initChatDatabase()]);
    })().catch((err) => {
      initPromise = undefined;
      throw err;
    });
  }
  return initPromise;
}
