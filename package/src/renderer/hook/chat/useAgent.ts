import { useEffect } from "react";
import { create } from "zustand";
import type { Agent } from "@common/api/chat";

const AGENT_STORAGE_KEY = "jezzlab.ai.agent";

interface AgentState {
  // 所有可用的 Agents
  agents: Agent[];
  // 当前选中的 Agent ID
  currentAgentId: string;
  // 是否已加载
  loaded: boolean;

  // Actions
  setAgents: (agents: Agent[]) => void;
  setCurrentAgentId: (id: string) => void;
  loadAgents: () => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  currentAgentId: "assistant", // 默认使用通用助手
  loaded: false,

  setAgents: (agents) => set({ agents }),

  setCurrentAgentId: (id) => {
    set({ currentAgentId: id });
    // 保存到 localStorage
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AGENT_STORAGE_KEY, id);
    }
  },

  loadAgents: async () => {
    if (get().loaded) return;

    try {
      // 从后端加载 Agents
      const agents = await window.api.chat.agents();
      set({ agents, loaded: true });

      // 从 localStorage 恢复选中的 Agent
      if (typeof window !== "undefined") {
        const savedAgentId = window.localStorage.getItem(AGENT_STORAGE_KEY);
        if (savedAgentId && agents.some((a) => a.id === savedAgentId)) {
          set({ currentAgentId: savedAgentId });
        }
      }
    } catch (error) {
      console.error("[useAgent] 加载 Agents 失败:", error);
    }
  },
}));

/**
 * 使用 Agent 的 Hook
 */
export function useAgent() {
  const agents = useAgentStore((state) => state.agents);
  const currentAgentId = useAgentStore((state) => state.currentAgentId);
  const loaded = useAgentStore((state) => state.loaded);
  const setCurrentAgentId = useAgentStore((state) => state.setCurrentAgentId);
  const loadAgents = useAgentStore((state) => state.loadAgents);

  // 自动加载 Agents
  useEffect(() => {
    if (!loaded) {
      void loadAgents();
    }
  }, [loaded, loadAgents]);

  // 获取当前 Agent 对象
  const currentAgent = agents.find((a) => a.id === currentAgentId) || agents[0];

  return {
    agents,
    currentAgent,
    currentAgentId,
    setCurrentAgentId,
    loaded,
  };
}
