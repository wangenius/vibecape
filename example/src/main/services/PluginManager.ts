import { ipcMain, app } from "electron";
import path from "path";
import { PluginMainContext } from "@common/types/plugin";
import StatsPlugin from "../../plugins/jezz-stats/main";

const builtInPlugins = [StatsPlugin];

export class PluginManager {
  init() {
    builtInPlugins.forEach((plugin) => {
      if (plugin.onMainLoad) {
        const context: PluginMainContext = {
          // 自动加前缀：com.wangenius.stats:get-daily
          ipcHandle: (channel, listener) => {
            const fullChannel = `${plugin.id}:${channel}`;
            console.log(`[PluginManager] Registering IPC: ${fullChannel}`);
            ipcMain.handle(fullChannel, listener);
          },
          getDbPath: () =>
            path.join(app.getPath("userData"), `${plugin.id}.db`),
        };
        plugin.onMainLoad(context);
      }
    });
  }
}

export const pluginManager = new PluginManager();
