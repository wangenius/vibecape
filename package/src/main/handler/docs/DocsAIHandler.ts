import { ipcMain, type WebContents } from "electron";
import { Model } from "../../services/Model";
import { streamText } from "ai";

const STREAM_CHANNEL_PREFIX = "docs:ai:stream:";

const getStreamChannel = (requestId: string): string =>
  `${STREAM_CHANNEL_PREFIX}${requestId}`;

interface DocsAIContext {
  docId?: string;
  docTitle?: string;
  mode: "polish" | "generate";
  outputFormat: "markdown" | "plaintext";
  contextBefore?: string;
  selectedText?: string;
  prompt: string;
}

interface DocsAIPayload {
  id: string;
  context: DocsAIContext;
}

/**
 * 根据上下文构建系统提示词
 */
function buildSystemPrompt(context: DocsAIContext): string {
  const { mode, outputFormat, contextBefore, selectedText } = context;

  if (mode === "polish") {
    // 润色模式
    let prompt = `根据用户的需求，改写以下文字。

原文：
${selectedText || ""}`;

    if (contextBefore) {
      prompt += `

上文参考：
${contextBefore}`;
    }

    prompt += `

要求：
1. 直接输出改写后的内容，不要有任何前缀或解释
2. 保持原文的核心意思
3. 保持与上下文一致的风格和语气
4. ${outputFormat === "plaintext" ? "纯文本输出，不使用 Markdown 格式" : "使用 Markdown 格式输出"}`;

    return prompt;
  } else {
    // 生成模式
    let prompt = `根据用户的指令生成内容。`;

    if (contextBefore) {
      prompt += `

上文参考：
${contextBefore}`;
    }

    prompt += `

要求：
1. 直接输出生成的内容，不要有任何前缀或解释
2. 保持与上下文一致的风格和语气
3. 使用 Markdown 格式输出`;

    return prompt;
  }
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
  const { context } = payload;

  try {
    // 根据上下文构建系统提示词
    const systemPrompt = buildSystemPrompt(context);

    const messages: { role: "user" | "assistant" | "system"; content: string }[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: context.prompt },
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
