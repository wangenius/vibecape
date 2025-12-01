/**
 * Novel AI Handler
 * 处理小说相关的 AI 生成功能
 */

import { ipcMain, type WebContents } from "electron";
import { Model } from "../../services/Model";
import { streamText } from "ai";

// 流式请求状态管理
interface StreamState {
  abortController: AbortController;
  accumulatedText: string;
}

const activeStreams = new Map<string, StreamState>();
const STREAM_CHANNEL_PREFIX = "novel:ai:stream:";

const getStreamChannel = (requestId: string): string =>
  `${STREAM_CHANNEL_PREFIX}${requestId}`;

/**
 * 处理流式响应
 */
async function handleStreamResponse(
  requestId: string,
  messages: any[],
  channel: string,
  webContents: WebContents
): Promise<void> {
  const main = await Model.get();
  const abortController = new AbortController();

  // 初始化流状态
  const streamState: StreamState = {
    abortController,
    accumulatedText: "",
  };
  activeStreams.set(requestId, streamState);

  const result = streamText({
    model: main,
    system: "不要使用双换行",
    messages,
    abortSignal: abortController.signal,

    onChunk: ({ chunk }) => {
      if (chunk.type === "text-delta") {
        streamState.accumulatedText += chunk.text;
      }
      console.log(chunk);
      webContents.send(channel, chunk);
    },

    onFinish: async () => {
      webContents.send(channel, { type: "end" });
      activeStreams.delete(requestId);
    },

    onError: async ({ error }) => {
      const err = error as Error;
      const isAborted = err?.name === "AbortError";

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

// AI 生成（用于 AI 改写等场景）
ipcMain.handle(
  "novel:ai:generate",
  async (event, payload: { id: string; prompt: string; messages?: any[] }) => {
    const requestId = payload.id;
    const channel = getStreamChannel(requestId);

    try {
      const messages = [
        ...(payload.messages || []),
        { role: "user" as const, content: payload.prompt },
      ];

      await handleStreamResponse(requestId, messages, channel, event.sender);

      return { success: true, channel };
    } catch (error: any) {
      throw new Error(error?.message || "生成失败");
    }
  }
);

// 取消 AI 生成
ipcMain.handle("novel:ai:cancel", async (_event, id: string) => {
  const streamState = activeStreams.get(id);
  if (streamState) {
    streamState.abortController.abort();
    activeStreams.delete(id);
  }
  return { success: true };
});
