import { ChatThreadMeta, ChatThread } from "@common/schema";
import type { Agent } from "../../main/agents/types";

export interface ChatAPI {
  // 获取聊天线程
  get: (id: string) => Promise<ChatThread>;
  // 获取聊天线程列表
  list: (payload?: {
    limit?: number;
    offset?: number;
  }) => Promise<ChatThreadMeta[]>;
  // 创建聊天线程
  create: () => Promise<ChatThreadMeta>;
  // 删除聊天线程
  delete: (id: string) => Promise<{ success: boolean }>;
  /**
   * 清空聊天线程消息
   * @param id 线程ID
   * @param thread 线程ID
   * @param prompt 用户最新消息
   */
  stream: (payload: {
    id: string;
    thread: string;
    prompt: string;
    agentId?: string;
  }) => Promise<{ success: boolean }>;
  // 获取所有 Agents
  agents: () => Promise<Agent[]>;
  // 取消聊天
  cancel: (id: string) => Promise<{ success: boolean }>;
  // 监听线程标题更新事件
  onThreadUpdated: (
    callback: (data: { threadId: string; title: string }) => void
  ) => () => void;
}

export type { Agent };
