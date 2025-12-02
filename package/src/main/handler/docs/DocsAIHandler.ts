import { ipcMain, type WebContents } from "electron";
import { Model } from "../../services/Model";
import { streamText } from "ai";

const STREAM_CHANNEL_PREFIX = "docs:ai:stream:";

const getStreamChannel = (requestId: string): string =>
  `${STREAM_CHANNEL_PREFIX}${requestId}`;

interface DocsAIPayload {
  id: string;
  prompt: string;
  messages?: { role: string; content: string }[];
}

// 流式请求状态管理
const activeStreams = new Map<string, AbortController>();

/**
 * 处理流式响应
 */
async function handleStreamResponse(
  requestId: string,
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  channel: string,
  webContents: WebContents
): Promise<void> {
  // 优先使用 fast 模型，fallback 到 primary
  let model;
  try {
    model = await Model.get("fast");
  } catch {
    model = await Model.get("primary");
  }

  const abortController = new AbortController();
  activeStreams.set(requestId, abortController);

  const result = streamText({
    model,
    messages,
    abortSignal: abortController.signal,

    onChunk: ({ chunk }) => {
      if (chunk.type === "text-delta") {
        webContents.send(channel, { type: "text-delta", text: chunk.text });
      } else if (chunk.type === "reasoning-delta") {
        // 发送 reasoning 内容
        webContents.send(channel, { 
          type: "reasoning-delta", 
          text: (chunk as { text?: string }).text || "" 
        });
      }
    },

    onFinish: () => {
      webContents.send(channel, { type: "end" });
      activeStreams.delete(requestId);
    },

    onError: ({ error }) => {
      const err = error as Error;
      const isAborted = err?.name === "AbortError";
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

// AI 生成
ipcMain.handle("docs:ai:generate", async (event, payload: DocsAIPayload) => {
  const requestId = payload.id;
  const channel = getStreamChannel(requestId);

  try {
    const messages: { role: "user" | "assistant" | "system"; content: string }[] = [
      ...(payload.messages || []).map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
      { role: "user" as const, content: payload.prompt },
    ];

    await handleStreamResponse(requestId, messages, channel, event.sender);

    return { success: true };
  } catch (error: any) {
    throw new Error(error?.message || "AI 生成失败");
  }
});

// 取消流式请求
ipcMain.handle("docs:ai:cancel", async (_event, id: string) => {
  const controller = activeStreams.get(id);
  if (controller) {
    controller.abort();
    activeStreams.delete(id);
  }
  return { success: true };
});
