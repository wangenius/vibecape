"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UIMessage } from "ai";

interface ChatState {
  messages: UIMessage[];
  setMessages: (messages: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => void;
  addMessage: (message: UIMessage) => void;
  clearMessages: () => void;
  updateMessage: (id: string, updater: (msg: UIMessage) => UIMessage) => void;
}

const welcomeMessage: UIMessage = {
  id: "welcome",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Hello, I'm wangenius. How can I assist you today?",
    },
  ],
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [welcomeMessage],
      
      setMessages: (messages) =>
        set((state) => ({
          messages: typeof messages === "function" ? messages(state.messages) : messages,
        })),
      
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      
      clearMessages: () =>
        set({
          messages: [welcomeMessage],
        }),
      
      updateMessage: (id, updater) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? updater(msg) : msg
          ),
        })),
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage),
      // 只持久化 messages
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);

