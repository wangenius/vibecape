/**
 * 聊天流式服务
 * 处理 AI 对话的流式响应、工具调用等核心业务逻辑
 */

import type { WebContents } from "electron";
import { streamText, stepCountIs } from "ai";
import type { ChatThread } from "@common/schema/chat";
import type { MessagePart } from "@common/types/message";
import { Chat } from "./Chat";
import { Model } from "./Model";
import { MCPManager } from "./MCPManager";
import {
  getAllHeroes,
  getHero,
  getDefaultHero,
  Hero,
  type HeroMeta,
} from "../heroes";
import { createDocumentTools } from "../heroes/tools/document";
import { createDocContentTools } from "../heroes/tools/docContent";
import { createDocManagementTools } from "../heroes/tools/docs";

// 流式请求状态管理
interface StreamState {
  abortController: AbortController;
  threadId?: string;
  parts: MessagePart[];
  currentText: string;
  currentReasoning: string;
}

export interface ChatStreamPayload {
  id: string;
  thread: string;
  prompt: string;
  messages?: any[];
  heroId?: string;
  /** @deprecated 使用 heroId */
  agentId?: string;
}

export interface InlineEditPayload {
  id: string;
  instruction: string;
  selection: string;
  context?: {
    before: string;
    after: string;
  };
}

const STREAM_CHANNEL_PREFIX = "llm:stream:";

class ChatStreamService {
  private activeStreams = new Map<string, StreamState>();

  /**
   * 获取流式通道名称
   */
  getStreamChannel(requestId: string): string {
    return `${STREAM_CHANNEL_PREFIX}${requestId}`;
  }

  /**
   * 获取 Hero 模块
   */
  getHeroForPayload(heroId?: string): Hero {
    return heroId ? (getHero(heroId) ?? getDefaultHero()) : getDefaultHero();
  }

  /**
   * 获取所有 Heroes 元信息
   */
  getAllHeroesMeta(): HeroMeta[] {
    return getAllHeroes().map((h) => h.getMeta());
  }

  /**
   * 异步生成线程标题（不阻塞主流程）
   */
  async generateThreadTitle(
    threadId: string,
    userMessage: string,
    webContents: WebContents
  ): Promise<void> {
    console.log("[ChatStream] 开始生成标题, threadId:", threadId);
    try {
      // 优先使用 fast 模型，若未配置则 fallback 到 primary 模型
      let model;
      try {
        model = await Model.get("fast");
        console.log("[ChatStream] 使用 fast 模型");
      } catch {
        model = await Model.get("primary");
        console.log("[ChatStream] fallback 到 primary 模型");
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
      console.log("[ChatStream] 生成标题结果:", text);

      if (text) {
        const title = text.trim().replace(/^["']|["']$/g, ""); // 去除可能的引号
        await Chat.updateThreadTitle(threadId, title);
        console.log("[ChatStream] 标题已更新:", title);
        // 通知前端刷新线程列表
        webContents.send("chat:thread-updated", { threadId, title });
      }
    } catch (error) {
      console.error("[ChatStream] 生成标题失败:", error);
    }
  }

  /**
   * 构建消息列表
   */
  async buildMessages(
    thread: ChatThread | null,
    payload: { prompt: string; messages?: any[]; heroId?: string }
  ) {
    // 获取 Hero 配置
    const hero = this.getHeroForPayload(payload.heroId);
    const systemPrompt = hero.getSystemPrompt();
    console.log(
      "[ChatStream] buildMessages - heroId:",
      payload.heroId,
      "hero.id:",
      hero.id
    );
    console.log(
      "[ChatStream] systemPrompt (first 200 chars):",
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

  /**
   * 保存消息
   */
  private async saveMessage(
    threadId: string | undefined,
    parts: MessagePart[]
  ) {
    if (!threadId || parts.length === 0) return;
    await Chat.addMessage(threadId, "assistant", parts);
  }

  /**
   * 处理流式响应
   */
  async handleStreamResponse(
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
    this.activeStreams.set(requestId, state);

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

    // 合并 Hero 工具和 MCP 工具
    const mcpTools = MCPManager.getAllTools();
    const docEditorTools = createDocumentTools(webContents);
    const docContentTools = createDocContentTools(webContents);
    const docManagementTools = createDocManagementTools();
    const allTools = {
      ...hero.tools,
      ...docEditorTools,
      ...docContentTools,
      ...docManagementTools,
      ...mcpTools,
    };
    console.log(
      `[ChatStream] Using ${Object.keys(hero.tools).length} hero tools + ${Object.keys(docEditorTools).length} editor tools + ${Object.keys(docContentTools).length} content tools + ${Object.keys(docManagementTools).length} management tools + ${Object.keys(mcpTools).length} MCP tools`
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
          // 实时输出文本片段到终端（不换行）
          process.stdout.write(chunk.text);
        } else if (chunk.type === "reasoning-delta") {
          if (state.currentText) flush();
          const reasoningText = (chunk as { text?: string }).text || "";
          state.currentReasoning += reasoningText;
          // 输出推理内容（灰色）
          process.stdout.write(`\x1b[90m${reasoningText}\x1b[0m`);
        } else if (chunk.type === "tool-call") {
          flush();
          const toolName =
            (chunk as { toolName?: string }).toolName || "unknown";
          const toolArgs = (chunk as { input?: unknown }).input;
          // 工具调用日志（黄色）
          console.log(`\n\x1b[33m🔧 Tool Call: ${toolName}\x1b[0m`);
          console.log(
            `\x1b[90m   Args: ${JSON.stringify(toolArgs, null, 2).split("\n").join("\n   ")}\x1b[0m`
          );
          state.parts.push({
            type: `tool-${toolName}`,
            toolCallId:
              (chunk as { toolCallId?: string }).toolCallId ||
              `${toolName}-${Date.now()}`,
            state: "input-available",
            input: toolArgs,
          } as MessagePart);
        } else if (chunk.type === "tool-result") {
          const resultToolCallId = (chunk as { toolCallId?: string })
            .toolCallId;
          const toolResult = (chunk as { output?: unknown }).output;
          const tc = state.parts.find(
            (p) =>
              p.type.startsWith("tool-") &&
              (p as { toolCallId?: string }).toolCallId === resultToolCallId
          );
          if (tc) {
            const toolName = tc.type.replace("tool-", "");
            // 工具结果日志（绿色）
            const resultStr = JSON.stringify(toolResult, null, 2);
            const truncatedResult =
              resultStr.length > 500 ? resultStr.slice(0, 500) + "..." : resultStr;
            console.log(`\x1b[32m✓ Tool Result: ${toolName}\x1b[0m`);
            console.log(
              `\x1b[90m   ${truncatedResult.split("\n").join("\n   ")}\x1b[0m`
            );
            (tc as { state: string; output?: unknown }).state =
              "output-available";
            (tc as { output?: unknown }).output = toolResult;

            // 检测文档管理工具，通知前端刷新
            const docManagementToolNames = [
              "createDocument",
              "renameDocument",
              "updateDocumentMetadata",
              "moveDocument",
              "reorderDocument",
              "deleteDocument",
            ];
            if (docManagementToolNames.includes(toolName)) {
              webContents.send("docs:changed", { tool: toolName });
            }
          }
        }
        webContents.send(channel, chunk);
      },

      onFinish: async () => {
        try {
          flush();
          // 完成日志
          console.log(`\n\x1b[36m✓ Stream completed\x1b[0m`);
          await this.saveMessage(threadId, state.parts);
          webContents.send(channel, { type: "end" });
        } catch (error: any) {
          webContents.send(channel, {
            type: "error",
            message: error?.message || "保存消息失败",
          });
        } finally {
          this.activeStreams.delete(requestId);
        }
      },

      onError: async ({ error }) => {
        const err = error as Error;
        const isAborted = err?.name === "AbortError";
        if (isAborted) {
          flush();
          console.log(`\n\x1b[33m⚠ Stream aborted\x1b[0m`);
          await this.saveMessage(threadId, state.parts);
        } else {
          console.log(`\n\x1b[31m✗ Stream error: ${err?.message}\x1b[0m`);
        }
        webContents.send(channel, {
          type: "error",
          message: isAborted ? "请求已取消" : err?.message || "生成失败",
        });
        this.activeStreams.delete(requestId);
      },
    });

    setImmediate(() => result.consumeStream());
  }

  /**
   * 取消流式请求
   */
  async cancelStream(requestId: string): Promise<{ success: boolean }> {
    const state = this.activeStreams.get(requestId);
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
    await this.saveMessage(state.threadId, state.parts);

    // 清空以避免 onError 重复保存
    state.parts = [];
    state.currentText = "";
    state.currentReasoning = "";

    // 取消请求
    state.abortController.abort();
    this.activeStreams.delete(requestId);

    return { success: true };
  }

  /**
   * 处理内联编辑流式响应
   */
  async handleInlineEdit(
    payload: InlineEditPayload,
    channel: string,
    webContents: WebContents
  ): Promise<void> {
    // 优先使用 fast 模型
    let model;
    try {
      model = await Model.get("fast");
    } catch {
      model = await Model.get("primary");
    }

    const abortController = new AbortController();

    const state: StreamState = {
      abortController,
      parts: [],
      currentText: "",
      currentReasoning: "",
    };
    this.activeStreams.set(payload.id, state);

    const systemPrompt = `You are an AI writing assistant embedded in a text editor.
Your task is to rewrite the selected text based on the user's instruction.
You must output ONLY the rewritten text. Do not include any explanations, prefixes, or suffixes.
Do not use markdown code blocks unless the user explicitly asks for code.
Maintain the original formatting style unless asked to change it.`;

    const userPrompt = `
Context Before: ...${payload.context?.before?.slice(-200) || ""}
Selected Text: ${payload.selection}
Context After: ${payload.context?.after?.slice(0, 200) || ""}...

Instruction: ${payload.instruction}
`;

    const result = streamText({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      abortSignal: abortController.signal,

      onChunk: ({ chunk }) => {
        if (chunk.type === "text-delta") {
          state.currentText += chunk.text;
          webContents.send(channel, chunk);
        }
      },

      onFinish: () => {
        webContents.send(channel, { type: "end" });
        this.activeStreams.delete(payload.id);
      },

      onError: ({ error }) => {
        webContents.send(channel, {
          type: "error",
          message: (error as Error).message,
        });
        this.activeStreams.delete(payload.id);
      },
    });

    setImmediate(() => result.consumeStream());
  }
}

// 单例导出
export const ChatStream = new ChatStreamService();
