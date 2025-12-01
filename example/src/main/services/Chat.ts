import {
  chatThreads,
  chatMessages,
  type ChatThreadMeta,
  type ChatMessage,
  ChatThread,
} from "@common/schema/chat";
import { chatDb } from "../db/chat";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * 聊天服务
 * 管理聊天线程和消息（独立于项目）
 */
export class Chat {
  /**
   * 获取所有聊天线程
   */
  static async listThreads(
    limit = 50,
    offset = 0
  ): Promise<ChatThreadMeta[]> {
    return chatDb
      .select()
      .from(chatThreads)
      .orderBy(desc(chatThreads.updated_at))
      .limit(limit)
      .offset(offset)
      .all();
  }

  /**
   * 获取聊天线程详情
   * 使用 drizzle 关系查询，一次性返回 thread 及其关联的 messages
   */
  static async getThread(threadId: string): Promise<ChatThread | null> {
    console.log("[ChatService] Getting thread:", threadId);

    const result = await chatDb.query.chatThreads.findFirst({
      where: eq(chatThreads.id, threadId),
      with: {
        messages: {
          orderBy: (messages, { asc }) => [asc(messages.sequence)],
        },
      },
    });

    if (!result) {
      console.log("[ChatService] Thread not found");
      return null;
    }

    // 转换为 UIMessage 格式
    return result;
  }

  /**
   * 创建聊天线程
   */
  static async createThread(): Promise<ChatThreadMeta> {
    const [thread] = await chatDb
      .insert(chatThreads)
      .values({
        id: nanoid(),
        title: "",
        metadata: {},
      })
      .returning();

    return thread;
  }

  /**
   * 添加消息到线程
   */
  static async addMessage(
    threadId: string,
    role: "user" | "assistant" | "system",
    parts: any[]
  ): Promise<ChatMessage> {
    // 检查线程是否存在
    const thread = await chatDb
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.id, threadId))
      .get();

    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    // 获取当前最大序列号
    const messages = await chatDb
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.thread_id, threadId))
      .orderBy(desc(chatMessages.sequence))
      .limit(1)
      .all();

    const sequence = messages.length > 0 ? messages[0].sequence + 1 : 0;

    const [message] = await chatDb
      .insert(chatMessages)
      .values({
        id: nanoid(),
        thread_id: threadId,
        role,
        parts: parts as any,
        sequence,
        metadata: {},
      } as any)
      .returning();

    // 更新线程的 updated_at
    await chatDb
      .update(chatThreads)
      .set({ updated_at: Date.now() })
      .where(eq(chatThreads.id, threadId));

    return message;
  }

  /**
   * 更新消息内容
   */
  static async updateMessage(messageId: string, parts: any[]): Promise<void> {
    await chatDb
      .update(chatMessages)
      .set({
        parts: parts as any,
        updated_at: Date.now(),
      })
      .where(eq(chatMessages.id, messageId));
  }

  /**
   * 清空线程消息
   */
  static async clearThread(threadId: string): Promise<void> {
    await chatDb
      .delete(chatMessages)
      .where(eq(chatMessages.thread_id, threadId));
  }

  /**
   * 删除线程
   */
  static async removeThread(threadId: string): Promise<void> {
    await chatDb.delete(chatThreads).where(eq(chatThreads.id, threadId));
  }

  /**
   * 更新线程标题（内部方法）
   */
  static async updateThreadTitle(
    threadId: string,
    title: string
  ): Promise<void> {
    await chatDb
      .update(chatThreads)
      .set({
        title,
        updated_at: Date.now(),
      })
      .where(eq(chatThreads.id, threadId));
  }
}
