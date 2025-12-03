import { create } from "zustand";
import type { UIMessage } from "ai";
import { gen } from "@common/lib/generator";
import type {
  TextPart,
  ReasoningPart,
  ToolPart,
  MessagePart,
} from "@common/types/message";
import { useAgentStore } from "./useAgent";

const STREAM_CHANNEL_PREFIX = "llm:stream:";
const getStreamChannel = (id: string) => `${STREAM_CHANNEL_PREFIX}${id}`;

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
  sendMessage: (chatId: string, text: string, agentId?: string) => Promise<void>;

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

  sendMessage: async (chatId, text, agentId) => {
    const { addMessage, setStatus, setError } = get();

    setStatus(chatId, "submitted");
    setError(chatId, null);

    const ipc = window.electron?.ipcRenderer;
    if (!ipc) {
      setError(chatId, new Error("通信通道不可用"));
      setStatus(chatId, "error");
      return;
    }

    try {
      // 添加用户消息
      const userMessage: UIMessage = {
        id: gen.id(),
        role: "user",
        parts: [{ type: "text", text }],
      };
      addMessage(chatId, userMessage);

      // 创建一个占位的助手消息
      const assistantMessage: UIMessage = {
        id: gen.id(),
        role: "assistant",
        parts: [{ type: "text", text: "" }],
      };
      addMessage(chatId, assistantMessage);

      const requestId = gen.id();

      console.log("[useChat] Starting stream with threadId:", chatId, "agentId:", agentId);
      const response = await window.api.chat.stream({
        id: requestId,
        thread: chatId,
        prompt: text,
        agentId,
      });

      if (!response?.success) {
        throw new Error("启动流式对话失败");
      }

      const channel = getStreamChannel(requestId);

      console.log("[useChat] Stream started - channel:", channel);

      setStatus(chatId, "streaming");

      // 按原始顺序累积 parts (v5 格式)
      const parts: MessagePart[] = [];
      let currentText = "";
      let currentReasoning = "";

      // flush 当前累积的内容到 parts
      const flush = () => {
        if (currentReasoning) {
          parts.push({ type: "reasoning", text: currentReasoning } as ReasoningPart);
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
        if (currentReasoning) display.push({ type: "reasoning", text: currentReasoning } as ReasoningPart);
        if (currentText) display.push({ type: "text", text: currentText } as TextPart);
        return (display.length > 0 ? display : [{ type: "text", text: "" }]) as UIMessage["parts"];
      };

      const updateMessage = () => {
        get().updateLastMessage(chatId, { parts: buildDisplayParts() });
      };

      // 监听流式数据
      const handler = (_event: unknown, chunk: { type: string; text?: string; toolCallId?: string; toolName?: string; args?: unknown; result?: unknown; message?: string }) => {
        if (!chunk || typeof chunk !== "object") return;

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
            input: chunk.args || {},
          };
          parts.push(toolPart);
          updateMessage();
        } else if (chunk.type === "tool-result") {
          const tc = parts.find((p): p is ToolPart => 
            p.type.startsWith("tool-") && 
            (p as ToolPart).toolCallId === chunk.toolCallId
          );
          if (tc) {
            tc.state = "output-available";
            tc.output = chunk.result;
          }
          updateMessage();
        } else if (chunk.type === "end") {
          console.log("[useChat] Stream finished");
          cleanup();
          setStatus(chatId, "idle");
        } else if (chunk.type === "error") {
          console.error("[useChat] Stream error:", chunk.message);
          cleanup();
          setError(chatId, new Error(chunk.message || "生成失败"));
          setStatus(chatId, "error");
        }
      };

      const cleanup = () => {
        ipc.removeAllListeners(channel);
        activeRequests.delete(chatId);
      };

      // 注册监听器
      ipc.on(channel, handler);

      // 保存请求信息，用于取消
      activeRequests.set(chatId, {
        requestId,
        abort: () => {
          cleanup();
          window.api.chat.cancel(requestId).catch(console.warn);
        },
      });
    } catch (error: any) {
      console.error("[useChat] Send message error:", error);
      setError(chatId, error);
      setStatus(chatId, "error");
    }
  },

  stop: (chatId) => {
    const request = activeRequests.get(chatId);
    if (request) {
      request.abort();
      get().setStatus(chatId, "idle");
    }
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

  // 获取当前选中的 Agent ID
  const currentAgentId = useAgentStore((state) => state.currentAgentId);

  const sendMessageFn = useChatStore((state) => state.sendMessage);
  const stop = useChatStore((state) => state.stop);
  const regenerate = useChatStore((state) => state.regenerate);
  const setError = useChatStore((state) => state.setError);

  return {
    messages,
    status,
    error,
    threadId,
    sendMessage: (text: string) => sendMessageFn(chatId, text, currentAgentId),
    stop: () => stop(chatId),
    regenerate: () => regenerate(chatId),
    clearError: () => setError(chatId, null),
  };
}
