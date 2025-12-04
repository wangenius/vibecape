/**
 * MCP (Model Context Protocol) 客户端管理器
 * 使用 @ai-sdk/mcp 管理多个 MCP 服务器连接
 */

import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport as StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio";
import { BrowserWindow } from "electron";
import { getMCPConfig } from "./UserData";
import type { MCPServerConfig } from "@common/schema/config";
import type { Tool } from "ai";

// MCP 客户端连接状态
export type MCPClientStatus = "disconnected" | "connecting" | "connected" | "error";

// MCP 客户端类型
type MCPClient = Awaited<ReturnType<typeof createMCPClient>>;

// 单个 MCP 客户端实例
interface MCPClientInstance {
  config: MCPServerConfig;
  client: MCPClient | null;
  status: MCPClientStatus;
  error?: string;
  tools: Record<string, Tool>;
}

// MCP 工具元信息（用于状态查询）
export interface MCPToolMeta {
  name: string;
  serverName: string;
  description?: string;
}

class MCPManagerService {
  private clients: Map<string, MCPClientInstance> = new Map();

  /**
   * 通知前端 MCP 状态已更新
   */
  private notifyStatusChange(): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      win.webContents.send("mcp:status-changed");
    }
  }

  /**
   * 初始化所有已启用的 MCP 服务器连接
   */
  async initialize(): Promise<void> {
    const config = getMCPConfig();
    if (!config.enabled) {
      console.log("[MCP] MCP is disabled");
      this.notifyStatusChange();
      return;
    }

    const enabledServers = config.servers.filter((s) => s.enabled);
    console.log(`[MCP] Initializing ${enabledServers.length} MCP servers`);

    for (const server of enabledServers) {
      await this.connect(server.name);
    }
    
    // 初始化完成后通知前端
    this.notifyStatusChange();
  }

  /**
   * 连接到指定的 MCP 服务器
   */
  async connect(serverName: string): Promise<{ success: boolean; error?: string }> {
    const config = getMCPConfig();
    const serverConfig = config.servers.find((s) => s.name === serverName);

    if (!serverConfig) {
      return { success: false, error: `Server "${serverName}" not found` };
    }

    // 如果已连接，先断开
    if (this.clients.has(serverName)) {
      await this.disconnect(serverName);
    }

    const instance: MCPClientInstance = {
      config: serverConfig,
      client: null,
      status: "connecting",
      tools: {},
    };
    this.clients.set(serverName, instance);

    try {
      console.log(`[MCP] Connecting to ${serverName}: ${serverConfig.command} ${serverConfig.args.join(" ")}`);

      // 使用 AI SDK MCP 创建客户端
      const transport = new StdioMCPTransport({
        command: serverConfig.command,
        args: serverConfig.args,
        env: serverConfig.env,
      });

      const client = await createMCPClient({ transport });

      // 获取工具列表（AI SDK 格式，可直接用于 streamText/generateText）
      const tools = await client.tools();

      instance.client = client;
      instance.status = "connected";
      instance.tools = tools;

      console.log(`[MCP] Connected to ${serverName}, found ${Object.keys(tools).length} tools`);
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      instance.status = "error";
      instance.error = errorMsg;
      console.error(`[MCP] Failed to connect to ${serverName}:`, errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 断开指定的 MCP 服务器连接
   */
  async disconnect(serverName: string): Promise<void> {
    const instance = this.clients.get(serverName);
    if (!instance) return;

    try {
      if (instance.client) {
        await instance.client.close();
      }
    } catch (error) {
      console.error(`[MCP] Error disconnecting from ${serverName}:`, error);
    }

    this.clients.delete(serverName);
    console.log(`[MCP] Disconnected from ${serverName}`);
  }

  /**
   * 断开所有连接
   */
  async disconnectAll(): Promise<void> {
    const serverNames = Array.from(this.clients.keys());
    for (const name of serverNames) {
      await this.disconnect(name);
    }
  }

  /**
   * 重新加载配置并重新连接
   */
  async reload(): Promise<void> {
    await this.disconnectAll();
    await this.initialize();
  }

  /**
   * 获取所有服务器的状态
   */
  getStatus(): Record<string, { status: MCPClientStatus; error?: string; toolCount: number }> {
    const result: Record<string, { status: MCPClientStatus; error?: string; toolCount: number }> = {};
    for (const [name, instance] of this.clients) {
      result[name] = {
        status: instance.status,
        error: instance.error,
        toolCount: Object.keys(instance.tools).length,
      };
    }
    return result;
  }

  /**
   * 获取所有已连接服务器的工具（AI SDK 格式，可直接用于 streamText/generateText）
   */
  getAllTools(): Record<string, Tool> {
    const tools: Record<string, Tool> = {};
    for (const [, instance] of this.clients) {
      if (instance.status === "connected") {
        Object.assign(tools, instance.tools);
      }
    }
    return tools;
  }

  /**
   * 获取所有工具的元信息（用于 UI 展示）
   */
  getAllToolsMeta(): MCPToolMeta[] {
    const metas: MCPToolMeta[] = [];
    for (const [serverName, instance] of this.clients) {
      if (instance.status === "connected") {
        for (const [name, tool] of Object.entries(instance.tools)) {
          metas.push({
            name,
            serverName,
            description: tool.description,
          });
        }
      }
    }
    return metas;
  }

  /**
   * 根据工具名调用工具（用于 IPC 接口）
   * AI SDK 的工具已内置 execute 方法，直接调用即可
   */
  async callToolByName(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const tools = this.getAllTools();
    const tool = tools[toolName];
    
    if (!tool) {
      throw new Error(`Tool "${toolName}" not found in any connected MCP server`);
    }

    if (!tool.execute) {
      throw new Error(`Tool "${toolName}" does not have an execute method`);
    }

    console.log(`[MCP] Calling tool ${toolName} with args:`, args);
    // AI SDK Tool.execute 需要 ToolCallOptions，包含 messages 和 toolCallId
    const result = await tool.execute(args, {
      toolCallId: `manual-${Date.now()}`,
      messages: [],
    });
    console.log(`[MCP] Tool ${toolName} result:`, result);
    return result;
  }
}

// 单例导出
export const MCPManager = new MCPManagerService();
