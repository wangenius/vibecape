import { ipcMain } from "electron";
import { updateProxyConfigCache } from "../../utils/proxy";
import { SettingsService } from "../../services/Settings";
import { type Shape } from "@common/lib/shape";

// ==================== Settings API ====================

ipcMain.handle("settings:get", async () => {
  try {
    return await SettingsService.get();
  } catch (error) {
    console.error("获取设置失败:", error);
    throw error;
  }
});

ipcMain.handle(
  "settings:update",
  async (_event, path: Shape, value: unknown) => {
    try {
      const next = await SettingsService.update(path, value);
      updateProxyConfigCache(next.general.proxy);
      return next;
    } catch (error) {
      console.error("更新设置失败:", error);
      throw error;
    }
  }
);
