/**
 * 应用配置 IPC Handler
 * 读写 ~/vibecape/config.json
 */

import { ipcMain } from "electron";
import { updateProxyConfigCache } from "../../utils/proxy";
import { SettingsService } from "../../services/Settings";
import { type Shape } from "@common/lib/shape";

// ==================== Settings API ====================

ipcMain.handle("settings:get", () => {
  try {
    return SettingsService.get();
  } catch (error) {
    console.error("获取设置失败:", error);
    throw error;
  }
});

ipcMain.handle(
  "settings:update",
  (_event, path: Shape, value: unknown) => {
    try {
      const next = SettingsService.update(path, value);
      updateProxyConfigCache(next.proxy);
      return next;
    } catch (error) {
      console.error("更新设置失败:", error);
      throw error;
    }
  }
);
