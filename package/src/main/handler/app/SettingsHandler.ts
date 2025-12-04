/**
 * 应用配置 IPC Handler
 * 读写 ~/vibecape/config.json 和 ~/vibecape/mcp.json
 */

import { ipcMain } from "electron";
import { updateProxyConfigCache } from "../../utils/proxy";
import { SettingsService } from "../../services/Settings";
import { getMCPConfig, setMCPConfig } from "../../services/UserData";
import { MCPManager } from "../../services/MCPManager";
import { type Shape } from "@common/lib/shape";
import { type MCPConfig } from "@common/schema/config";

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

// ==================== MCP API ====================

ipcMain.handle("mcp:get", () => {
  try {
    return getMCPConfig();
  } catch (error) {
    console.error("获取 MCP 配置失败:", error);
    throw error;
  }
});

ipcMain.handle("mcp:set", async (_event, config: MCPConfig) => {
  try {
    setMCPConfig(config);
    // 重新加载 MCP 连接
    await MCPManager.reload();
    return config;
  } catch (error) {
    console.error("更新 MCP 配置失败:", error);
    throw error;
  }
});

// 连接到指定 MCP 服务器
ipcMain.handle("mcp:connect", async (_event, serverName: string) => {
  try {
    return await MCPManager.connect(serverName);
  } catch (error) {
    console.error(`连接 MCP 服务器 ${serverName} 失败:`, error);
    throw error;
  }
});

// 断开指定 MCP 服务器
ipcMain.handle("mcp:disconnect", async (_event, serverName: string) => {
  try {
    await MCPManager.disconnect(serverName);
    return { success: true };
  } catch (error) {
    console.error(`断开 MCP 服务器 ${serverName} 失败:`, error);
    throw error;
  }
});

// 获取所有 MCP 服务器状态
ipcMain.handle("mcp:status", () => {
  try {
    return MCPManager.getStatus();
  } catch (error) {
    console.error("获取 MCP 状态失败:", error);
    throw error;
  }
});

// 获取所有可用的 MCP 工具（返回可序列化的元信息，而非完整 Tool 对象）
ipcMain.handle("mcp:tools", () => {
  try {
    return MCPManager.getAllToolsMeta();
  } catch (error) {
    console.error("获取 MCP 工具失败:", error);
    throw error;
  }
});

// 调用 MCP 工具
ipcMain.handle(
  "mcp:callTool",
  async (_event, toolName: string, args: Record<string, unknown>) => {
    try {
      return await MCPManager.callToolByName(toolName, args);
    } catch (error) {
      console.error(`调用 MCP 工具 ${toolName} 失败:`, error);
      throw error;
    }
  }
);

// 重新加载所有 MCP 连接
ipcMain.handle("mcp:reload", async () => {
  try {
    await MCPManager.reload();
    return { success: true };
  } catch (error) {
    console.error("重新加载 MCP 失败:", error);
    throw error;
  }
});
