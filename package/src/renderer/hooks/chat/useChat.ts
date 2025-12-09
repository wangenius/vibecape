import { create } from "zustand";
import type { UIMessage } from "ai";
import { gen } from "@common/lib/generator";
import type {
  TextPart,
  ReasoningPart,
  ToolPart,
  MessagePart,
} from "@common/types/message";
import { useHeroStore } from "./useHero";
import { lang } from "@/lib/locales/i18n";

const STREAM_CHANNEL_PREFIX = "llm:stream:";
const getStreamChannel = (id: string) => `${STREAM_CHANNEL_PREFIX}${id}`;

// 消息队列项
interface QueuedMessage {
  text: string;
  heroId?: string;
  resolve: () => void;
  reject: (error: Error) => void;
}

// 消息队列管理器
class MessageQueue {
  private queues = new Map<string, QueuedMessage[]>();
  private processing = new Map<string, boolean>();

  // 添加消息到队列
  enqueue(chatId: string, message: Omit<QueuedMessage, 'resolve' | 'reject'>): Promise<void> {
    return new Promise((resolve, reject) => {
      const queue = this.queues.get(chatId) || [];
      queue.push({ ...message, resolve, reject });
      this.queues.set(chatId, queue);
      console.log(`[MessageQueue] Enqueued message for ${chatId}, queue length: ${queue.length}`);
    });
  }

  // 获取下一条消息
  dequeue(chatId: string): QueuedMessage | undefined {
    const queue = this.queues.get(chatId);
    if (!queue || queue.length === 0) return undefined;
    return queue.shift();
  }

  // 检查是否正在处理
  isProcessing(chatId: string): boolean {
    return this.processing.get(chatId) || false;
  }

  // 设置处理状态
  setProcessing(chatId: string, value: boolean): void {
    this.processing.set(chatId, value);
  }

  // 获取队列长度
  getQueueLength(chatId: string): number {
    return this.queues.get(chatId)?.length || 0;
  }

  // 清空队列
  clear(chatId: string): void {
    const queue = this.queues.get(chatId);
    if (queue) {
      // 拒绝所有等待中的消息
      queue.forEach(msg => msg.reject(new Error('Queue cleared')));
      this.queues.delete(chatId);
    }
    this.processing.delete(chatId);
  }

  // 获取待处理消息数（队列长度 + 正在处理的）
  getPendingCount(chatId: string): number {
    const queueLength = this.queues.get(chatId)?.length || 0;
    const processing = this.processing.get(chatId) ? 1 : 0;
    return queueLength + processing;
  }
}

// 全局消息队列实例
const messageQueue = new MessageQueue();

// 每个对话的状态
interface ChatState {
  messages: UIMessage[];
  status: "idle" | "streaming" | "submitted" | "error";
  error: Error | null;
  threadId?: string; // 数据库中的 thread ID
}

// 全局 store，管理所有对话
interface ChatStore {
  // 所有对话的状态，key 是 chatId（可能是临时 ID 或 threadId）
  chats: Map<string, ChatState>;

  // 获取对话状态
  getChat: (chatId: string) => ChatState;

  // 设置对话消息
  setMessages: (chatId: string, messages: UIMessage[]) => void;

  // 从数据库加载历史消息
  loadHistoryMessages: (chatId: string) => Promise<void>;

  // 添加消息
  addMessage: (chatId: string, message: UIMessage) => void;

  // 更新最后一条消息（流式传输）
  updateLastMessage: (chatId: string, message: Partial<UIMessage>) => void;

  // 设置状态
  setStatus: (chatId: string, status: ChatState["status"]) => void;

  // 设置错误
  setError: (chatId: string, error: Error | null) => void;

  // 更新 threadId
  setThreadId: (chatId: string, threadId: string) => void;

  // 发送消息
  sendMessage: (chatId: string, text: string, heroId?: string) => Promise<void>;

  // 停止生成
  stop: (chatId: string) => void;

  // 重新生成
  regenerate: (chatId: string) => Promise<void>;
}

// 存储活跃的流式请求
const activeRequests = new Map<
  string,
  { requestId: string; abort: () => void }
>();

// 内部发送消息的实现（实际执行流式请求）
const sendMessageInternal = async (
  chatId: string,
  text: string,
  heroId: string | undefined,
  store: ChatStore
): Promise<void> => {
  const { addMessage, setStatus, setError } = store;

  console.log(
    "[useChat] sendMessageInternal called - chatId:",
    chatId,
    "text:",
    text.substring(0, 50)
  );

  setStatus(chatId, "submitted");
  setError(chatId, null);

  const ipc = window.electron?.ipcRenderer;
  console.log("[useChat] ipcRenderer available:", !!ipc);
  if (!ipc) {
    console.error("[useChat] ipcRenderer not available!");
    setError(chatId, new Error(lang("common.chat.channelUnavailable")));
    setStatus(chatId, "error");
    throw new Error(lang("common.chat.channelUnavailable"));
  }

  return new Promise((resolve, reject) => {
    // 添加用户消息
    const userMessage: UIMessage = {
      id: gen.id(),
      role: "user",
      parts: [{ type: "text", text }],
    };
    addMessage(chatId, userMessage);
    console.log("[useChat] User message added");

    // 创建一个占位的助手消息
    const assistantMessage: UIMessage = {
      id: gen.id(),
      role: "assistant",
      parts: [{ type: "text", text: "" }],
    };
    addMessage(chatId, assistantMessage);
    console.log("[useChat] Assistant placeholder added");

    const requestId = gen.id();

    console.log(
      "[useChat] Starting stream with threadId:",
      chatId,
      "heroId:",
      heroId,
      "requestId:",
      requestId
    );

    const channel = getStreamChannel(requestId);
    console.log("[useChat] Will listen on channel:", channel);

    // 先注册监听器，再发送请求
    const cleanup = () => {
      console.log(
        "[useChat] Cleanup - removing listeners for channel:",
        channel
      );
      ipc.removeAllListeners(channel);
      activeRequests.delete(chatId);
    };

    // 按原始顺序累积 parts (v5 格式)
    const parts: MessagePart[] = [];
    let currentText = "";
    let currentReasoning = "";

    // flush 当前累积的内容到 parts
    const flush = () => {
      if (currentReasoning) {
        parts.push({
          type: "reasoning",
          text: currentReasoning,
        } as ReasoningPart);
        currentReasoning = "";
      }
      if (currentText) {
        parts.push({ type: "text", text: currentText } as TextPart);
        currentText = "";
      }
    };

    // 构建显示用的 parts
    const buildDisplayParts = (): UIMessage["parts"] => {
      const display: MessagePart[] = [...parts];
      if (currentReasoning)
        display.push({
          type: "reasoning",
          text: currentReasoning,
        } as ReasoningPart);
      if (currentText)
        display.push({ type: "text", text: currentText } as TextPart);
      return (
        display.length > 0 ? display : [{ type: "text", text: "" }]
      ) as UIMessage["parts"];
    };

    const updateMessage = () => {
      store.updateLastMessage(chatId, { parts: buildDisplayParts() });
    };

    // 监听流式数据
    const handler = (
      _event: unknown,
      chunk: {
        type: string;
        text?: string;
        toolCallId?: string;
        toolName?: string;
        args?: unknown;
        input?: unknown;
        result?: unknown;
        output?: unknown;
        message?: string;
      }
    ) => {
      if (!chunk || typeof chunk !== "object") return;
      console.log("[useChat] Received chunk:", chunk.type);

      if (chunk.type === "text-delta") {
        if (currentReasoning) flush();
        currentText += chunk.text || "";
        updateMessage();
      } else if (chunk.type === "reasoning-delta") {
        if (currentText) flush();
        currentReasoning += chunk.text || "";
        updateMessage();
      } else if (chunk.type === "tool-call") {
        flush();
        const toolName = chunk.toolName || "unknown";
        const toolPart: ToolPart = {
          type: `tool-${toolName}`,
          toolCallId: chunk.toolCallId || gen.id(),
          state: "input-available",
          input: chunk.input ?? chunk.args ?? {},
        };
        parts.push(toolPart);
        updateMessage();
      } else if (chunk.type === "tool-result") {
        const tc = parts.find(
          (p): p is ToolPart =>
            p.type.startsWith("tool-") &&
            (p as ToolPart).toolCallId === chunk.toolCallId
        );
        if (tc) {
          tc.state = "output-available";
          tc.output = chunk.output ?? chunk.result;
        }
        updateMessage();
      } else if (chunk.type === "end") {
        console.log("[useChat] Stream finished");
        cleanup();
        setStatus(chatId, "idle");
        resolve();
      } else if (chunk.type === "error") {
        console.error("[useChat] Stream error:", chunk.message);
        cleanup();
        const error = new Error(chunk.message || lang("common.chat.generationFailed"));
        setError(chatId, error);
        setStatus(chatId, "error");
        reject(error);
      }
    };

    // 注册监听器
    console.log("[useChat] Registering listener on channel:", channel);
    ipc.on(channel, handler);

    // 保存请求信息，用于取消
    activeRequests.set(chatId, {
      requestId,
      abort: () => {
        cleanup();
        window.api.chat.cancel(requestId).catch(console.warn);
        resolve(); // 取消时也 resolve，让队列继续
      },
    });

    // 发送请求
    console.log("[useChat] Sending stream request...");
    window.api.chat.stream({
      id: requestId,
      thread: chatId,
      prompt: text,
      heroId,
    }).then(response => {
      console.log("[useChat] Stream request response:", response);
      if (!response?.success) {
        cleanup();
        const error = new Error(lang("common.chat.startStreamFailed"));
        setError(chatId, error);
        setStatus(chatId, "error");
        reject(error);
      } else {
        setStatus(chatId, "streaming");
      }
    }).catch(error => {
      console.error("[useChat] Send message error:", error);
      cleanup();
      setError(chatId, error);
      setStatus(chatId, "error");
      reject(error);
    });
  });
};

// 处理消息队列
const processQueue = async (chatId: string, store: ChatStore): Promise<void> => {
  if (messageQueue.isProcessing(chatId)) {
    console.log(`[MessageQueue] Already processing ${chatId}, skipping`);
    return;
  }

  messageQueue.setProcessing(chatId, true);
  console.log(`[MessageQueue] Start processing queue for ${chatId}`);

  try {
    let message: QueuedMessage | undefined;
    while ((message = messageQueue.dequeue(chatId))) {
      console.log(`[MessageQueue] Processing message for ${chatId}, remaining: ${messageQueue.getQueueLength(chatId)}`);
      try {
        await sendMessageInternal(chatId, message.text, message.heroId, store);
        message.resolve();
      } catch (error) {
        console.error(`[MessageQueue] Message failed for ${chatId}:`, error);
        message.reject(error as Error);
        // 继续处理队列中的下一条消息
      }
    }
  } finally {
    messageQueue.setProcessing(chatId, false);
    console.log(`[MessageQueue] Finished processing queue for ${chatId}`);
  }
};

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: new Map(),

  getChat: (chatId) => {
    const { chats } = get();
    return (
      chats.get(chatId) || {
        messages: [],
        status: "idle",
        error: null,
      }
    );
  },

  setMessages: (chatId, messages) => {
    set((state) => {
      const nextChats = new Map(state.chats);
      const chat = nextChats.get(chatId) || {
        messages: [],
        status: "idle" as const,
        error: null,
      };
      nextChats.set(chatId, { ...chat, messages });
      return { chats: nextChats };
    });
  },

  loadHistoryMessages: async (chatId) => {
    try {
      // 如果 store 中已有消息，跳过加载
      const currentChat = get().chats.get(chatId);
      if (currentChat && currentChat.messages.length > 0) {
        console.log("[useChat] Store 中已有消息，跳过加载");
        return;
      }

      // 从数据库加载
      console.log("[useChat] 从数据库加载历史消息:", chatId);
      const detail = await window.api.chat.get(chatId);
      if (detail && detail.messages.length > 0) {
        get().setMessages(chatId, detail.messages as UIMessage[]);
      }
    } catch (error) {
      console.error("[useChat] 加载历史消息失败:", error);
    }
  },

  addMessage: (chatId, message) => {
    console.log(
      "[useChat] addMessage:",
      message.role,
      "message, id:",
      message.id
    );
    set((state) => {
      const nextChats = new Map(state.chats);
      const chat = nextChats.get(chatId) || {
        messages: [],
        status: "idle" as const,
        error: null,
      };
      nextChats.set(chatId, {
        ...chat,
        messages: [...chat.messages, message],
      });
      console.log(
        "[useChat] addMessage: total messages now:",
        chat.messages.length + 1
      );
      return { chats: nextChats };
    });
  },

  updateLastMessage: (chatId, messageUpdate) => {
    set((state) => {
      const nextChats = new Map(state.chats);
      const chat = nextChats.get(chatId);
      if (!chat || chat.messages.length === 0) {
        console.warn(
          "[useChat] updateLastMessage: no chat or no messages for",
          chatId
        );
        return state;
      }

      const messages = [...chat.messages];
      const lastMessage = messages[messages.length - 1];

      // 确保我们更新的是助手消息
      if (lastMessage.role !== "assistant") {
        console.error(
          "[useChat] updateLastMessage: 最后一条消息不是助手消息！role:",
          lastMessage.role
        );
        return state;
      }

      console.log(
        "[useChat] updateLastMessage: updating assistant message, id:",
        lastMessage.id
      );

      messages[messages.length - 1] = { ...lastMessage, ...messageUpdate };

      console.log(
        "[useChat] updateLastMessage: updated, total messages:",
        messages.length
      );
      nextChats.set(chatId, { ...chat, messages });
      return { chats: nextChats };
    });
  },

  setStatus: (chatId, status) => {
    set((state) => {
      const nextChats = new Map(state.chats);
      const chat = nextChats.get(chatId) || {
        messages: [],
        status: "idle" as const,
        error: null,
      };
      nextChats.set(chatId, { ...chat, status });
      return { chats: nextChats };
    });
  },

  setError: (chatId, error) => {
    set((state) => {
      const nextChats = new Map(state.chats);
      const chat = nextChats.get(chatId) || {
        messages: [],
        status: "idle" as const,
        error: null,
      };
      nextChats.set(chatId, {
        ...chat,
        error,
        status: error ? "error" : chat.status,
      });
      return { chats: nextChats };
    });
  },

  setThreadId: (chatId, threadId) => {
    set((state) => {
      const nextChats = new Map(state.chats);
      const chat = nextChats.get(chatId);
      if (!chat) return state;

      // 更新 threadId
      nextChats.set(chatId, { ...chat, threadId });
      return { chats: nextChats };
    });
  },

  sendMessage: async (chatId, text, heroId) => {
    console.log(
      "[useChat] sendMessage called - chatId:",
      chatId,
      "text:",
      text.substring(0, 50),
      "queue length:",
      messageQueue.getQueueLength(chatId)
    );

    // 将消息加入队列
    const messagePromise = messageQueue.enqueue(chatId, { text, heroId });

    // 触发队列处理（如果尚未处理）
    void processQueue(chatId, get());

    // 等待消息处理完成
    return messagePromise;
  },

  stop: (chatId) => {
    const request = activeRequests.get(chatId);
    if (request) {
      request.abort();
      get().setStatus(chatId, "idle");
    }
    // 清空该 chat 的消息队列
    messageQueue.clear(chatId);
  },

  regenerate: async (chatId) => {
    const { getChat, setMessages, sendMessage } = get();
    const chat = getChat(chatId);

    // 移除最后两条消息（用户消息和助手消息）
    if (chat.messages.length >= 2) {
      const messages = chat.messages.slice(0, -2);
      setMessages(chatId, messages);

      // 获取最后一条用户消息的文本
      const lastUserMessage = messages
        .slice()
        .reverse()
        .find((m) => m.role === "user");

      if (lastUserMessage) {
        const text = lastUserMessage.parts
          .filter(
            (p): p is Extract<typeof p, { type: "text" }> => p.type === "text"
          )
          .map((p) => p.text)
          .join("");

        await sendMessage(chatId, text);
      }
    }
  },
}));

// 空数组常量（用于默认值）
const EMPTY_MESSAGES: UIMessage[] = [];

/**
 * 使用对话的 Hook
 * @param chatId 对话 ID（可以是临时 ID 或 threadId）
 */
export function useChat(chatId: string) {
  // 使用 selector 订阅具体字段，避免不必要的重新渲染
  const messages = useChatStore(
    (state) => state.chats.get(chatId)?.messages ?? EMPTY_MESSAGES
  );
  const status = useChatStore(
    (state) => state.chats.get(chatId)?.status ?? "idle"
  );
  const error = useChatStore((state) => state.chats.get(chatId)?.error ?? null);
  const threadId = useChatStore((state) => state.chats.get(chatId)?.threadId);

  const sendMessageFn = useChatStore((state) => state.sendMessage);
  const stop = useChatStore((state) => state.stop);
  const regenerate = useChatStore((state) => state.regenerate);
  const setError = useChatStore((state) => state.setError);

  return {
    messages,
    status,
    error,
    threadId,
    // 在调用时动态获取 currentHeroId，避免闭包捕获旧值
    sendMessage: (text: string) => {
      const currentHeroId = useHeroStore.getState().currentHeroId;
      console.log("[useChat] sendMessage called with heroId:", currentHeroId);
      return sendMessageFn(chatId, text, currentHeroId);
    },
    stop: () => stop(chatId),
    regenerate: () => regenerate(chatId),
    clearError: () => setError(chatId, null),
    // 获取队列中待处理的消息数
    getQueueLength: () => messageQueue.getQueueLength(chatId),
  };
}
