import { ipcMain, type WebContents } from "electron";
import { Chat } from "../../services/Chat";
import { Model } from "../../services/Model";
import { streamText } from "ai";
import type { ChatThread } from "@common/schema/chat";

// 流式请求状态管理
interface StreamState {
  abortController: AbortController;
  threadId?: string;
  accumulatedText: string;
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
}

/**
 * 异步生成线程标题（不阻塞主流程）
 */
async function generateThreadTitle(
  threadId: string,
  userMessage: string
): Promise<void> {
  try {
    // 直接获取 fast 模型实例（已配置好）
    const fastModel = await Model.get("fast");

    streamText({
      model: fastModel,
      messages: [
        {
          role: "system",
          content:
            "你是一个标题生成助手。根据用户的消息，生成一个简洁、准确的对话标题，不超过20个字。只输出标题内容，不要有任何前缀、后缀或引号。",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `请为以下对话生成一个20字以内的标题：\n\n${userMessage}`,
            },
          ],
        },
      ],
      temperature: 1,
      maxOutputTokens: 30,
      stopSequences: ["\n"],
      onFinish: ({ text }) => {
        console.log("text", text);
        if (text) {
          Chat.updateThreadTitle(threadId, text);
        }
      },
    }).consumeStream();
  } catch (error) {
    console.error("[ChatHandler] 生成标题失败:", error);
  }
}

/**
 * 构建消息列表
 */
async function buildMessages(
  thread: ChatThread | null,
  payload: { prompt: string; messages?: any[] }
) {
  if (!thread) {
    // 非聊天场景：使用前端传来的消息
    return [
      ...(payload.messages || []),
      { role: "user" as const, content: payload.prompt },
    ];
  }

  // 聊天场景：添加用户消息并获取历史
  await Chat.addMessage(thread.id, "user", [
    { type: "text", text: payload.prompt },
  ]);

  const refreshed = await Chat.getThread(thread.id);
  const historyMessages = refreshed?.messages ?? [];

  return historyMessages.map((msg) => ({
    role: msg.role as "user" | "assistant" | "system",
    content:
      msg.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("") || "",
  }));
}

/**
 * 保存累积的消息文本
 */
async function saveAccumulatedText(
  threadId: string | undefined,
  text: string
): Promise<void> {
  if (!threadId || !text) return;

  try {
    await Chat.addMessage(threadId, "assistant", [{ type: "text", text }]);
  } catch (error) {
    console.error("[ChatHandler] 保存消息失败:", error);
    throw error;
  }
}

/**
 * 处理流式响应
 */
async function handleStreamResponse(
  requestId: string,
  threadId: string | undefined,
  messages: any[],
  channel: string,
  webContents: WebContents
): Promise<void> {
  const main = await Model.get();
  const abortController = new AbortController();

  // 初始化流状态
  const streamState: StreamState = {
    abortController,
    threadId,
    accumulatedText: "",
  };
  activeStreams.set(requestId, streamState);

  const result = streamText({
    model: main,
    messages,
    abortSignal: abortController.signal,

    onChunk: ({ chunk }) => {
      if (chunk.type === "text-delta") {
        streamState.accumulatedText += chunk.text;
      }
      webContents.send(channel, chunk);
    },

    onFinish: async ({ text }) => {
      try {
        const finalText = text || streamState.accumulatedText;
        await saveAccumulatedText(threadId, finalText);
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

      // 保存中断前的累积文本
      if (isAborted && streamState.accumulatedText) {
        await saveAccumulatedText(threadId, streamState.accumulatedText);
      }

      webContents.send(channel, {
        type: "error",
        message: isAborted ? "请求已取消" : err?.message || "生成失败",
      });
      activeStreams.delete(requestId);
    },
  });

  // 延迟消费流，确保前端已注册监听器
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
ipcMain.handle(
  "chat:stream",
  async (event, payload: ChatStreamPayload) => {
    const requestId = payload.id;
    const channel = getStreamChannel(requestId);

    try {
      // 1. 确保线程存在
      const thread = await Chat.getThread(payload.thread);
      if (!thread) throw new Error("Thread not found");

      const isEmptyTitle = !thread.title.trim();

      const messages = await buildMessages(thread, payload);

      if (isEmptyTitle && payload.prompt) {
        void generateThreadTitle(thread.id, payload.prompt);
      }
      await handleStreamResponse(
        requestId,
        thread.id,
        messages,
        channel,
        event.sender
      );

      return { success: true };
    } catch (error: any) {
      throw new Error(error?.message || "流式请求失败");
    }
  }
);

// 取消流式请求
ipcMain.handle("chat:cancel", async (_event, id: string) => {
  const streamState = activeStreams.get(id);
  if (!streamState) {
    return { success: true };
  }

  // 保存累积的文本
  await saveAccumulatedText(streamState.threadId, streamState.accumulatedText);

  // 清空以避免 onError 重复保存
  streamState.accumulatedText = "";

  // 取消请求
  streamState.abortController.abort();
  activeStreams.delete(id);

  return { success: true };
});
