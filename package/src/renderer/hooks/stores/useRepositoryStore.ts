import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Repository, RepositoryEntry } from "@common/schema/repository";
import { useUIStore } from "./useUIStore";
import { useDocumentStore } from "./useDocumentStore";

// ============================================================================
// Repository Store - 工作区状态管理
// ============================================================================

type RepositoryState = {
  repository: Repository | null;
  repositoryList: RepositoryEntry[];
  docsRoot: string;
};

type RepositoryActions = {
  setDocsRoot: (path: string) => Promise<void>;
  createRepository: (name: string) => Promise<Repository | null>;
  openRepository: (id: string) => Promise<Repository | null>;
  deleteRepository: (id: string) => Promise<void>;
  loadRepositoryList: () => Promise<void>;
  closeRepository: () => Promise<void>;
  updateRepositoryConfig: (
    updates: Partial<Repository["config"]>
  ) => Promise<void>;
};

export const useRepositoryStore = create<RepositoryState & RepositoryActions>()(
  persist(
    (set, get) => ({
      repository: null,
      repositoryList: [],
      docsRoot: "",

      loadRepositoryList: async () => {
        useUIStore.getState().setListLoading(true);
        try {
          const repositoryList = await window.api.vibecape.listRepositorys();
          set({ repositoryList });
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
          await get().loadRepositoryList();
        } catch (error) {
          useUIStore.getState().setError((error as Error).message);
        }
      },

      createRepository: async (name: string) => {
        useUIStore.getState().setLoading(true);
        useUIStore.getState().clearError();
        try {
          const repository = await window.api.vibecape.createRepository(name);
          set({ repository });
          useDocumentStore.getState().reset();
          await get().loadRepositoryList();
          return repository;
        } catch (error) {
          useUIStore.getState().setError((error as Error).message);
          return null;
        } finally {
          useUIStore.getState().setLoading(false);
        }
      },

      openRepository: async (id: string) => {
        const uiStore = useUIStore.getState();
        const docStore = useDocumentStore.getState();

        uiStore.setLoading(true);
        uiStore.clearError();
        uiStore.setInitProgress("正在打开工作区...");

        try {
          const repository = await window.api.vibecape.openRepository(id);
          set({ repository });
          docStore.reset();

          uiStore.setInitProgress("正在加载文档树...");
          await docStore.refreshTree();
          await get().loadRepositoryList();

          uiStore.setInitProgress(null);
          return repository;
        } catch (error) {
          uiStore.setError((error as Error).message);
          uiStore.setInitProgress(null);
          return null;
        } finally {
          uiStore.setLoading(false);
          uiStore.setInitProgress(null);
        }
      },

      deleteRepository: async (id: string) => {
        const uiStore = useUIStore.getState();
        uiStore.setLoading(true);
        uiStore.clearError();

        try {
          await window.api.vibecape.deleteRepository(id);
          if (get().repository?.id === id) {
            set({ repository: null });
            useDocumentStore.getState().reset();
          }
          await get().loadRepositoryList();
        } catch (error) {
          uiStore.setError((error as Error).message);
        } finally {
          uiStore.setLoading(false);
        }
      },

      closeRepository: async () => {
        await window.api.vibecape.closeRepository();
        set({ repository: null });
        useDocumentStore.getState().reset();
        useUIStore.getState().clearError();
      },

      updateRepositoryConfig: async (updates) => {
        const { repository } = get();
        if (!repository) return;

        try {
          const newConfig =
            await window.api.vibecape.updateRepositoryConfig(updates);
          set({
            repository: {
              ...repository,
              config: newConfig,
            },
          });
        } catch (error) {
          useUIStore.getState().setError((error as Error).message);
        }
      },
    }),
    {
      name: "repository_store",
      partialize: () => ({}), // 不持久化任何状态
    }
  )
);
