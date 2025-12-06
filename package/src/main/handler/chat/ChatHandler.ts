/**
 * 聊天 IPC 处理器
 * 仅负责 IPC 通信，业务逻辑委托给 ChatStream 服务
 */

import { ipcMain } from "electron";
import { Chat } from "../../services/Chat";
import {
  ChatStream,
  type ChatStreamPayload,
  type InlineEditPayload,
} from "../../services/ChatStream";

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
  const channel = ChatStream.getStreamChannel(requestId);

  try {
    // 1. 确保线程存在
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
  } catch (error: any) {
    throw new Error(error?.message || "流式请求失败");
  }
});

// 取消流式请求
ipcMain.handle("chat:cancel", async (_event, id: string) => {
  return ChatStream.cancelStream(id);
});

// 获取所有 Heroes
ipcMain.handle("chat:heroes", async () => {
  return ChatStream.getAllHeroesMeta();
});

// 兼容旧接口
ipcMain.handle("chat:agents", async () => {
  return ChatStream.getAllHeroesMeta();
});

// 内联编辑请求
ipcMain.handle(
  "chat:inline-edit",
  async (event, payload: InlineEditPayload) => {
    const requestId = payload.id;
    const channel = ChatStream.getStreamChannel(requestId);

    try {
      await ChatStream.handleInlineEdit(payload, channel, event.sender);
      return { success: true };
    } catch (error: any) {
      throw new Error(error?.message || "内联编辑请求失败");
    }
  }
);
