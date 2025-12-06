import { ipcMain, type WebContents } from "electron";
import { Chat } from "../../services/Chat";
import { Model } from "../../services/Model";
import { MCPManager } from "../../services/MCPManager";
import { streamText, stepCountIs } from "ai";
import type { ChatThread } from "@common/schema/chat";
import type { MessagePart } from "@common/types/message";
import {
  getAllHeroes,
  getHero,
  getDefaultHero,
  Hero,
  type HeroMeta,
} from "../../heroes";
import { createDocumentTools } from "../../heroes/tools/document";
import { createDocManagementTools } from "../../heroes/tools/docs";

// 流式请求状态管理
interface StreamState {
  abortController: AbortController;
  threadId?: string;
  parts: MessagePart[];
  currentText: string;
  currentReasoning: string;
}

const activeStreams = new Map<string, StreamState>();
const STREAM_CHANNEL_PREFIX = "llm:stream:";

const getStreamChannel = (requestId: string): string =>
  `${STREAM_CHANNEL_PREFIX}${requestId}`;

interface ChatStreamPayload {
  id: string;
  thread: string;
  prompt: string;
  messages?: any[];
  heroId?: string;
  /** @deprecated 使用 heroId */
  agentId?: string;
}

/**
 * 异步生成线程标题（不阻塞主流程）
 */
async function generateThreadTitle(
  threadId: string,
  userMessage: string,
  webContents: WebContents
): Promise<void> {
  console.log("[ChatHandler] 开始生成标题, threadId:", threadId);
  try {
    // 优先使用 fast 模型，若未配置则 fallback 到 primary 模型
    let model;
    try {
      model = await Model.get("fast");
      console.log("[ChatHandler] 使用 fast 模型");
    } catch {
      model = await Model.get("primary");
      console.log("[ChatHandler] fallback 到 primary 模型");
    }

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "不要思考。你是一个标题生成助手。根据用户的消息，生成一个简洁、准确的对话标题，不超过15个字。只输出标题内容，不要有任何前缀、后缀或引号。",
        },
        {
          role: "user",
          content: `不要思考，请为以下对话生成一个15字以内的标题：\n\n${userMessage}`,
        },
      ],
      temperature: 0.7,
      maxOutputTokens: 50,
    });

    // 等待流完成并获取结果
    const text = await result.text;
    console.log("[ChatHandler] 生成标题结果:", text);

    if (text) {
      const title = text.trim().replace(/^["']|["']$/g, ""); // 去除可能的引号
      await Chat.updateThreadTitle(threadId, title);
      console.log("[ChatHandler] 标题已更新:", title);
      // 通知前端刷新线程列表
      webContents.send("chat:thread-updated", { threadId, title });
    }
  } catch (error) {
    console.error("[ChatHandler] 生成标题失败:", error);
  }
}

/**
 * 获取 Agent 模块
 */
function getHeroForPayload(heroId?: string): Hero {
  return heroId ? (getHero(heroId) ?? getDefaultHero()) : getDefaultHero();
}

/**
 * 构建消息列表
 */
async function buildMessages(
  thread: ChatThread | null,
  payload: { prompt: string; messages?: any[]; heroId?: string }
) {
  // 获取 Hero 配置
  const hero = getHeroForPayload(payload.heroId);
  const systemPrompt = hero.getSystemPrompt();
  console.log(
    "[ChatHandler] buildMessages - heroId:",
    payload.heroId,
    "hero.id:",
    hero.id
  );
  console.log(
    "[ChatHandler] systemPrompt (first 200 chars):",
    systemPrompt.substring(0, 200)
  );
  const systemMessage = { role: "system" as const, content: systemPrompt };

  if (!thread) {
    // 非聊天场景：使用前端传来的消息
    const messages = [
      ...(payload.messages || []),
      { role: "user" as const, content: payload.prompt },
    ];
    return systemMessage ? [systemMessage, ...messages] : messages;
  }

  // 聊天场景：添加用户消息并获取历史
  await Chat.addMessage(thread.id, "user", [
    { type: "text", text: payload.prompt },
  ]);

  const refreshed = await Chat.getThread(thread.id);
  const historyMessages = refreshed?.messages ?? [];

  const messages = historyMessages.map((msg) => ({
    role: msg.role as "user" | "assistant" | "system",
    content:
      msg.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("") || "",
  }));

  return [systemMessage, ...messages];
}

/** 保存消息 */
async function saveMessage(threadId: string | undefined, parts: MessagePart[]) {
  if (!threadId || parts.length === 0) return;
  await Chat.addMessage(threadId, "assistant", parts);
}

/** 处理流式响应 */
async function handleStreamResponse(
  requestId: string,
  threadId: string | undefined,
  messages: any[],
  channel: string,
  webContents: WebContents,
  hero: Hero
): Promise<void> {
  const main = await Model.get();
  const abortController = new AbortController();

  const state: StreamState = {
    abortController,
    threadId,
    parts: [],
    currentText: "",
    currentReasoning: "",
  };
  activeStreams.set(requestId, state);

  // flush 当前累积的内容到 parts
  const flush = () => {
    if (state.currentReasoning) {
      state.parts.push({ type: "reasoning", text: state.currentReasoning });
      state.currentReasoning = "";
    }
    if (state.currentText) {
      state.parts.push({ type: "text", text: state.currentText });
      state.currentText = "";
    }
  };

  // 合并 Hero 工具和 MCP 工具（AI SDK MCP 已返回可直接使用的工具格式）
  const mcpTools = MCPManager.getAllTools();
  const docEditorTools = createDocumentTools(webContents);
  const docManagementTools = createDocManagementTools();
  const allTools = {
    ...hero.tools,
    ...docEditorTools,
    ...docManagementTools,
    ...mcpTools,
  };
  console.log(
    `[ChatHandler] Using ${Object.keys(hero.tools).length} hero tools + ${Object.keys(docEditorTools).length} editor tools + ${Object.keys(docManagementTools).length} management tools + ${Object.keys(mcpTools).length} MCP tools`
  );

  const result = streamText({
    model: main,
    messages,
    tools: allTools,
    abortSignal: abortController.signal,
    stopWhen: stepCountIs(hero.maxSteps),

    onChunk: ({ chunk }) => {
      if (chunk.type === "text-delta") {
        if (state.currentReasoning) flush();
        state.currentText += chunk.text;
      } else if (chunk.type === "reasoning-delta") {
        if (state.currentText) flush();
        state.currentReasoning += (chunk as { text?: string }).text || "";
      } else if (chunk.type === "tool-call") {
        flush();
        const toolName = (chunk as { toolName?: string }).toolName || "unknown";
        state.parts.push({
          type: `tool-${toolName}`,
          toolCallId:
            (chunk as { toolCallId?: string }).toolCallId ||
            `${toolName}-${Date.now()}`,
          state: "input-available",
          input: (chunk as { args?: unknown }).args,
        } as MessagePart);
      } else if (chunk.type === "tool-result") {
        const resultToolCallId = (chunk as { toolCallId?: string }).toolCallId;
        const tc = state.parts.find(
          (p) =>
            p.type.startsWith("tool-") &&
            (p as { toolCallId?: string }).toolCallId === resultToolCallId
        );
        if (tc) {
          (tc as { state: string; output?: unknown }).state =
            "output-available";
          (tc as { output?: unknown }).output = (
            chunk as { result?: unknown }
          ).result;

          // 检测文档管理工具，通知前端刷新
          const docManagementTools = [
            "createDocument",
            "renameDocument",
            "updateDocumentMetadata",
            "moveDocument",
            "reorderDocument",
            "deleteDocument",
          ];
          const toolName = tc.type.replace("tool-", "");
          if (docManagementTools.includes(toolName)) {
            webContents.send("docs:changed", { tool: toolName });
          }
        }
      }
      webContents.send(channel, chunk);
    },

    onFinish: async () => {
      try {
        flush();
        await saveMessage(threadId, state.parts);
        webContents.send(channel, { type: "end" });
      } catch (error: any) {
        webContents.send(channel, {
          type: "error",
          message: error?.message || "保存消息失败",
        });
      } finally {
        activeStreams.delete(requestId);
      }
    },

    onError: async ({ error }) => {
      const err = error as Error;
      const isAborted = err?.name === "AbortError";
      if (isAborted) {
        flush();
        await saveMessage(threadId, state.parts);
      }
      webContents.send(channel, {
        type: "error",
        message: isAborted ? "请求已取消" : err?.message || "生成失败",
      });
      activeStreams.delete(requestId);
    },
  });

  setImmediate(() => result.consumeStream());
}

// ============ IPC Handlers ============

// 获取线程详情
ipcMain.handle("chat:get", async (_event, threadId: string) => {
  const thread = await Chat.getThread(threadId);
  if (!thread) {
    throw new Error("Thread not found");
  }
  return thread;
});

// 获取线程列表
ipcMain.handle(
  "chat:list",
  async (
    _event,
    payload?: {
      limit?: number;
      offset?: number;
    }
  ) => {
    return Chat.listThreads(payload?.limit ?? 50, payload?.offset ?? 0);
  }
);

// 创建线程
ipcMain.handle("chat:create", async () => {
  return Chat.createThread();
});

// 删除线程
ipcMain.handle("chat:delete", async (_event, threadId: string) => {
  await Chat.removeThread(threadId);
  return { success: true };
});

// 流式对话
ipcMain.handle("chat:stream", async (event, payload: ChatStreamPayload) => {
  const requestId = payload.id;
  const channel = getStreamChannel(requestId);

  try {
    // 1. 确保线程存在
    const thread = await Chat.getThread(payload.thread);
    if (!thread) throw new Error("Thread not found");

    const isEmptyTitle = !thread.title.trim();

    const heroId = payload.heroId || payload.agentId;
    const hero = getHeroForPayload(heroId);
    const messages = await buildMessages(thread, {
      prompt: payload.prompt,
      heroId,
    });

    if (isEmptyTitle && payload.prompt) {
      void generateThreadTitle(thread.id, payload.prompt, event.sender);
    }
    await handleStreamResponse(
      requestId,
      thread.id,
      messages,
      channel,
      event.sender,
      hero
    );

    return { success: true };
  } catch (error: any) {
    throw new Error(error?.message || "流式请求失败");
  }
});

// 取消流式请求
ipcMain.handle("chat:cancel", async (_event, id: string) => {
  const state = activeStreams.get(id);
  if (!state) {
    return { success: true };
  }

  // flush 并保存累积的内容
  if (state.currentReasoning) {
    state.parts.push({ type: "reasoning", text: state.currentReasoning });
  }
  if (state.currentText) {
    state.parts.push({ type: "text", text: state.currentText });
  }
  await saveMessage(state.threadId, state.parts);

  // 清空以避免 onError 重复保存
  state.parts = [];
  state.currentText = "";
  state.currentReasoning = "";

  // 取消请求
  state.abortController.abort();
  activeStreams.delete(id);

  return { success: true };
});

// 获取所有 Heroes
ipcMain.handle("chat:heroes", async (): Promise<HeroMeta[]> => {
  return getAllHeroes().map((h) => h.getMeta());
});

// 兼容旧接口
ipcMain.handle("chat:agents", async (): Promise<HeroMeta[]> => {
  return getAllHeroes().map((h) => h.getMeta());
});
