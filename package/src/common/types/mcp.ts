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
