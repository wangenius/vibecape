import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Workspace, WorkspaceEntry } from "@common/schema/workspace";
import { useUIStore } from "./useUIStore";
import { useDocumentStore } from "./useDocumentStore";

// ============================================================================
// Workspace Store - 工作区状态管理
// ============================================================================

type WorkspaceState = {
  workspace: Workspace | null;
  workspaceList: WorkspaceEntry[];
  docsRoot: string;
};

type WorkspaceActions = {
  setDocsRoot: (path: string) => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace | null>;
  openWorkspace: (id: string) => Promise<Workspace | null>;
  deleteWorkspace: (id: string) => Promise<void>;
  loadWorkspaceList: () => Promise<void>;
  closeWorkspace: () => Promise<void>;
  updateWorkspaceConfig: (
    updates: Partial<Workspace["config"]>
  ) => Promise<void>;
};

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()(
  persist(
    (set, get) => ({
      workspace: null,
      workspaceList: [],
      docsRoot: "",

      loadWorkspaceList: async () => {
        useUIStore.getState().setListLoading(true);
        try {
          const workspaceList = await window.api.vibecape.listWorkspaces();
          set({ workspaceList });
        } catch (error) {
          useUIStore.getState().setError((error as Error).message);
        } finally {
          useUIStore.getState().setListLoading(false);
        }
      },

      setDocsRoot: async (path: string) => {
        try {
          await window.api.vibecape.setDocsRoot(path);
          set({ docsRoot: path });
          await get().loadWorkspaceList();
        } catch (error) {
          useUIStore.getState().setError((error as Error).message);
        }
      },

      createWorkspace: async (name: string) => {
        useUIStore.getState().setLoading(true);
        useUIStore.getState().clearError();
        try {
          const workspace = await window.api.vibecape.createWorkspace(name);
          set({ workspace });
          useDocumentStore.getState().reset();
          await get().loadWorkspaceList();
          return workspace;
        } catch (error) {
          useUIStore.getState().setError((error as Error).message);
          return null;
        } finally {
          useUIStore.getState().setLoading(false);
        }
      },

      openWorkspace: async (id: string) => {
        const uiStore = useUIStore.getState();
        const docStore = useDocumentStore.getState();

        uiStore.setLoading(true);
        uiStore.clearError();
        uiStore.setInitProgress("正在打开工作区...");

        try {
          const workspace = await window.api.vibecape.openWorkspace(id);
          set({ workspace });
          docStore.reset();

          uiStore.setInitProgress("正在加载文档树...");
          await docStore.refreshTree();
          await get().loadWorkspaceList();

          uiStore.setInitProgress(null);
          return workspace;
        } catch (error) {
          uiStore.setError((error as Error).message);
          uiStore.setInitProgress(null);
          return null;
        } finally {
          uiStore.setLoading(false);
          uiStore.setInitProgress(null);
        }
      },

      deleteWorkspace: async (id: string) => {
        const uiStore = useUIStore.getState();
        uiStore.setLoading(true);
        uiStore.clearError();

        try {
          await window.api.vibecape.deleteWorkspace(id);
          if (get().workspace?.id === id) {
            set({ workspace: null });
            useDocumentStore.getState().reset();
          }
          await get().loadWorkspaceList();
        } catch (error) {
          uiStore.setError((error as Error).message);
        } finally {
          uiStore.setLoading(false);
        }
      },

      closeWorkspace: async () => {
        await window.api.vibecape.closeWorkspace();
        set({ workspace: null });
        useDocumentStore.getState().reset();
        useUIStore.getState().clearError();
      },

      updateWorkspaceConfig: async (updates) => {
        const { workspace } = get();
        if (!workspace) return;

        try {
          const newConfig =
            await window.api.vibecape.updateWorkspaceConfig(updates);
          set({
            workspace: {
              ...workspace,
              config: newConfig,
            },
          });
        } catch (error) {
          useUIStore.getState().setError((error as Error).message);
        }
      },
    }),
    {
      name: "workspace_store",
      partialize: () => ({}), // 不持久化任何状态
    }
  )
);
