/**
 * IPC Handler 入口
 * 统一注册所有 IPC handlers
 */

import { registerHandler } from "./registry";
import { createLogger } from "../utils/logger";

// Services
import { SettingsService } from "../services/Settings";
import { getMCPConfig, setMCPConfig } from "../services/UserData";
import { MCPManager } from "../services/MCPManager";
import { updateProxyConfigCache } from "../utils/proxy";
import { Model } from "../services/Model";
import { Provider } from "../services/Provider";
import { Chat } from "../services/Chat";
import {
  ChatStream,
  type ChatStreamPayload,
  type InlineEditPayload,
} from "../services/ChatStream";

// Types
import type { Shape } from "@common/lib/shape";
import type { MCPConfig } from "@common/schema/config";
import type { ModelInsert, ProviderInsert } from "@common/schema/app";

const logger = createLogger("Handler");

/**
 * 注册所有 IPC handlers
 */
export function registerAllHandlers(): void {
  logger.info("Registering IPC handlers");

  registerSettingsHandlers();
  registerMCPHandlers();
  registerModelHandlers();
  registerProviderHandlers();
  registerChatHandlers();

  // Docs handlers 仍使用副作用导入（文件系统操作较复杂）
  import("./docs/VibecapeHandler");
  import("./docs/DocsAIHandler");
  import("./docs/ImageHandler");

  logger.info("All IPC handlers registered");
}

// ==================== Settings ====================

function registerSettingsHandlers(): void {
  registerHandler(
    "settings:get",
    () => SettingsService.get(),
    { module: "Settings" }
  );

  registerHandler(
    "settings:update",
    (_event, path: Shape, value: unknown) => {
      const next = SettingsService.update(path, value);
      updateProxyConfigCache(next.proxy);
      return next;
    },
    { module: "Settings" }
  );
}

// ==================== MCP ====================

function registerMCPHandlers(): void {
  registerHandler(
    "mcp:get",
    () => getMCPConfig(),
    { module: "MCP" }
  );

  registerHandler(
    "mcp:set",
    async (_event, config: MCPConfig) => {
      setMCPConfig(config);
      await MCPManager.reload();
      return config;
    },
    { module: "MCP" }
  );

  registerHandler(
    "mcp:connect",
    async (_event, serverName: string) => MCPManager.connect(serverName),
    { module: "MCP" }
  );

  registerHandler(
    "mcp:disconnect",
    async (_event, serverName: string) => {
      await MCPManager.disconnect(serverName);
      return { success: true };
    },
    { module: "MCP" }
  );

  registerHandler(
    "mcp:status",
    () => MCPManager.getStatus(),
    { module: "MCP" }
  );

  registerHandler(
    "mcp:tools",
    () => MCPManager.getAllToolsMeta(),
    { module: "MCP" }
  );

  registerHandler(
    "mcp:callTool",
    async (_event, toolName: string, args: Record<string, unknown>) =>
      MCPManager.callToolByName(toolName, args),
    { module: "MCP" }
  );

  registerHandler(
    "mcp:reload",
    async () => {
      await MCPManager.reload();
      return { success: true };
    },
    { module: "MCP" }
  );
}

// ==================== Model ====================

function registerModelHandlers(): void {
  registerHandler(
    "model:list",
    () => Model.list(),
    { module: "Model" }
  );

  registerHandler(
    "model:create",
    async (_event, payload: ModelInsert) => Model.create(payload),
    { module: "Model" }
  );

  registerHandler(
    "model:update",
    async (_event, payload: { id: string; changes: Partial<ModelInsert> }) =>
      Model.update(payload.id, payload.changes),
    { module: "Model" }
  );

  registerHandler(
    "model:delete",
    async (_event, id: string) => {
      await Model.delete(id);
      return { success: true };
    },
    { module: "Model" }
  );
}

// ==================== Provider ====================

function registerProviderHandlers(): void {
  registerHandler(
    "provider:list",
    () => Provider.list(),
    { module: "Provider" }
  );

  registerHandler(
    "provider:get",
    (_event, id: string) => Provider.get(id),
    { module: "Provider" }
  );

  registerHandler(
    "provider:create",
    async (_event, payload: ProviderInsert) => Provider.create(payload),
    { module: "Provider" }
  );

  registerHandler(
    "provider:update",
    async (_event, payload: { id: string; changes: Partial<ProviderInsert> }) =>
      Provider.update(payload.id, payload.changes),
    { module: "Provider" }
  );

  registerHandler(
    "provider:delete",
    async (_event, id: string) => {
      await Provider.delete(id);
      return { success: true };
    },
    { module: "Provider" }
  );

  registerHandler(
    "provider:fetchModels",
    async (_event, providerId: string) => Provider.fetchRemoteModels(providerId),
    { module: "Provider" }
  );
}

// ==================== Chat ====================

function registerChatHandlers(): void {
  registerHandler(
    "chat:get",
    async (_event, threadId: string) => {
      const thread = await Chat.getThread(threadId);
      if (!thread) throw new Error("Thread not found");
      return thread;
    },
    { module: "Chat" }
  );

  registerHandler(
    "chat:list",
    async (_event, payload?: { limit?: number; offset?: number }) =>
      Chat.listThreads(payload?.limit ?? 50, payload?.offset ?? 0),
    { module: "Chat" }
  );

  registerHandler(
    "chat:create",
    async () => Chat.createThread(),
    { module: "Chat" }
  );

  registerHandler(
    "chat:delete",
    async (_event, threadId: string) => {
      await Chat.removeThread(threadId);
      return { success: true };
    },
    { module: "Chat" }
  );

  registerHandler(
    "chat:stream",
    async (event, payload: ChatStreamPayload) => {
      const requestId = payload.id;
      const channel = ChatStream.getStreamChannel(requestId);

      const thread = await Chat.getThread(payload.thread);
      if (!thread) throw new Error("Thread not found");

      const isEmptyTitle = !thread.title.trim();
      const heroId = payload.heroId;
      const hero = ChatStream.getHeroForPayload(heroId);
      const messages = await ChatStream.buildMessages(thread, {
        prompt: payload.prompt,
        heroId,
      });

      if (isEmptyTitle && payload.prompt) {
        void ChatStream.generateThreadTitle(
          thread.id,
          payload.prompt,
          event.sender
        );
      }

      await ChatStream.handleStreamResponse(
        requestId,
        thread.id,
        messages,
        channel,
        event.sender,
        hero
      );

      return { success: true };
    },
    { module: "Chat" }
  );

  registerHandler(
    "chat:cancel",
    async (_event, id: string) => ChatStream.cancelStream(id),
    { module: "Chat" }
  );

  registerHandler(
    "chat:heroes",
    async () => ChatStream.getAllHeroesMeta(),
    { module: "Chat" }
  );

  registerHandler(
    "chat:agents",
    async () => ChatStream.getAllHeroesMeta(),
    { module: "Chat" }
  );

  registerHandler(
    "chat:inline-edit",
    async (event, payload: InlineEditPayload) => {
      const requestId = payload.id;
      const channel = ChatStream.getStreamChannel(requestId);
      await ChatStream.handleInlineEdit(payload, channel, event.sender);
      return { success: true };
    },
    { module: "Chat" }
  );
}
