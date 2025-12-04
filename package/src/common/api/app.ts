import { Model, ModelInsert, Provider, ProviderInsert } from "@common/schema";
import type { AppConfig, MCPConfig } from "@common/schema/config";
import type { Shape } from "@common/lib/shape";

export interface SettingsAPI {
  /** 获取设置 */
  get: () => Promise<AppConfig>;
  /** 更新设置 */
  update: (path: Shape, value: unknown) => Promise<AppConfig>;
}

/** MCP 工具 */
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  serverName: string;
}

/** MCP 服务器状态 */
export interface MCPServerStatus {
  status: "disconnected" | "connecting" | "connected" | "error";
  error?: string;
  toolCount: number;
}

/** MCP 工具调用结果 */
export interface MCPToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface MCPAPI {
  /** 获取 MCP 配置 */
  get: () => Promise<MCPConfig>;
  /** 更新 MCP 配置 */
  set: (config: MCPConfig) => Promise<MCPConfig>;
  /** 连接到指定服务器 */
  connect: (serverName: string) => Promise<{ success: boolean; error?: string }>;
  /** 断开指定服务器 */
  disconnect: (serverName: string) => Promise<{ success: boolean }>;
  /** 获取所有服务器状态 */
  status: () => Promise<Record<string, MCPServerStatus>>;
  /** 获取所有可用工具 */
  tools: () => Promise<MCPTool[]>;
  /** 调用工具 */
  callTool: (toolName: string, args: Record<string, unknown>) => Promise<MCPToolResult>;
  /** 重新加载所有连接 */
  reload: () => Promise<{ success: boolean }>;
  /** 监听状态变化事件 */
  onStatusChanged: (callback: () => void) => () => void;
}

/** Provider 远程模型 */
export interface RemoteModel {
  id: string;
  object?: string;
}

/** Provider 管理 */
export interface ProviderAPI {
  /** 获取 Provider 列表 */
  list: () => Promise<Provider[]>;
  /** 获取单个 Provider */
  get: (id: string) => Promise<Provider | null>;
  /** 创建 Provider */
  create: (payload: ProviderInsert) => Promise<Provider>;
  /** 更新 Provider */
  update: (id: string, changes: Partial<ProviderInsert>) => Promise<Provider>;
  /** 删除 Provider */
  delete: (id: string) => Promise<{ success: boolean }>;
  /** 获取 Provider 远程模型列表 */
  fetchModels: (providerId: string) => Promise<RemoteModel[]>;
}

/** 模型管理 */
export interface ModelAPI {
  /** 获取模型列表 */
  list: () => Promise<Model[]>;
  /** 创建模型 */
  create: (payload: ModelInsert) => Promise<Model>;
  /** 更新模型 */
  update: (id: string, changes: Partial<ModelInsert>) => Promise<Model>;
  /** 删除模型 */
  delete: (id: string) => Promise<{ success: boolean }>;
}
