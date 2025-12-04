import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JSONContent } from "@tiptap/core";
import type { DocTreeNode, DocData } from "@common/schema/docs";
import type { Workspace, WorkspaceEntry } from "@common/schema/workspace";
import { initModels, initDefaultModels } from "@/hook/model/useModel";
import { initProviders } from "@/hook/model/useProvider";

type VibecapeState = {
  // 工作区
  workspace: Workspace | null;
  workspaceList: WorkspaceEntry[];
  docsRoot: string;
  // 文档树
  tree: DocTreeNode[];
  // 当前选中的文档 ID
  activeDocId: string | null;
  // 当前文档数据
  activeDoc: DocData | null;
  // 加载状态
  loading: boolean;
  listLoading: boolean;
  // 初始化进度信息
  initProgress: string | null;
  error?: string;
};

type VibecapeActions = {
  // 初始化
  bootstrap: () => Promise<void>;
  // 工作区操作
  setDocsRoot: (path: string) => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace | null>;
  openWorkspace: (id: string) => Promise<Workspace | null>;
  deleteWorkspace: (id: string) => Promise<void>;
  loadWorkspaceList: () => Promise<void>;
  closeWorkspace: () => Promise<void>;
  updateWorkspaceConfig: (updates: Partial<Workspace["config"]>) => Promise<void>;
  // 刷新文档树
  refreshTree: () => Promise<void>;
  // 打开文档
  openDoc: (id: string) => Promise<void>;
  // 保存当前文档
  saveDoc: (data: {
    title?: string;
    content?: JSONContent;
    metadata?: Record<string, any>;
  }) => Promise<void>;
  // 创建文档
  createDoc: (data: {
    parent_id?: string | null;
    title: string;
  }) => Promise<DocData>;
  // 删除文档
  deleteDoc: (id: string) => Promise<void>;
};

export const useVibecapeStore = create<VibecapeState & VibecapeActions>()(
  persist(
    (set, get) => ({
      workspace: null,
      workspaceList: [],
      docsRoot: "",
      tree: [],
      activeDocId: null,
      activeDoc: null,
      loading: false,
      listLoading: false,
      initProgress: null,
      error: undefined,

      bootstrap: async () => {
        try {
          await Promise.all([initModels(), initDefaultModels(), initProviders()]);

          // 获取 docs_root 路径
          const docsRoot = await window.api.vibecape.getDocsRoot();
          set({ docsRoot });

          // 加载工作区列表
          await get().loadWorkspaceList();

          // 尝试恢复上次打开的工作区
          const workspace = await window.api.vibecape.restoreLastWorkspace();
          if (workspace) {
            set({ workspace });
            await get().refreshTree();

            // 恢复上次打开的文档
            const { activeDocId } = get();
            if (activeDocId) {
              try {
                const doc = await window.api.vibecape.getDoc(activeDocId);
                set({ activeDoc: doc });
              } catch {
                set({ activeDocId: null, activeDoc: null });
              }
            }
          }
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      loadWorkspaceList: async () => {
        set({ listLoading: true });
        try {
          const workspaceList = await window.api.vibecape.listWorkspaces();
          set({ workspaceList });
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ listLoading: false });
        }
      },

      setDocsRoot: async (path: string) => {
        try {
          await window.api.vibecape.setDocsRoot(path);
          set({ docsRoot: path });
          await get().loadWorkspaceList();
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      createWorkspace: async (name: string) => {
        set({ loading: true, error: undefined });
        try {
          const workspace = await window.api.vibecape.createWorkspace(name);
          set({ workspace, tree: [], activeDocId: null, activeDoc: null });
          await get().loadWorkspaceList();
          return workspace;
        } catch (error) {
          set({ error: (error as Error).message });
          return null;
        } finally {
          set({ loading: false });
        }
      },

      openWorkspace: async (id: string) => {
        set({ loading: true, error: undefined, initProgress: "正在打开工作区..." });
        try {
          const workspace = await window.api.vibecape.openWorkspace(id);
          set({ workspace, activeDocId: null, activeDoc: null });

          set({ initProgress: "正在加载文档树..." });
          await get().refreshTree();
          await get().loadWorkspaceList();

          set({ initProgress: null });
          return workspace;
        } catch (error) {
          set({ error: (error as Error).message, initProgress: null });
          return null;
        } finally {
          set({ loading: false, initProgress: null });
        }
      },

      deleteWorkspace: async (id: string) => {
        set({ loading: true, error: undefined });
        try {
          await window.api.vibecape.deleteWorkspace(id);
          // 如果删除的是当前工作区，清空状态
          if (get().workspace?.id === id) {
            set({ workspace: null, tree: [], activeDocId: null, activeDoc: null });
          }
          await get().loadWorkspaceList();
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ loading: false });
        }
      },

      closeWorkspace: async () => {
        await window.api.vibecape.closeWorkspace();
        set({
          workspace: null,
          tree: [],
          activeDocId: null,
          activeDoc: null,
          error: undefined,
        });
      },

      updateWorkspaceConfig: async (updates) => {
        const { workspace } = get();
        if (!workspace) return;

        try {
          const newConfig = await window.api.vibecape.updateWorkspaceConfig(updates);
          set({
            workspace: {
              ...workspace,
              config: newConfig,
            },
          });
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      refreshTree: async () => {
        set({ loading: true, error: undefined });
        try {
          const tree = await window.api.vibecape.getTree();
          set({ tree });
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ loading: false });
        }
      },

      openDoc: async (id) => {
        set({ loading: true, error: undefined });
        try {
          const doc = await window.api.vibecape.getDoc(id);
          set({ activeDocId: id, activeDoc: doc });
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ loading: false });
        }
      },

      saveDoc: async (data) => {
        const { activeDocId, activeDoc } = get();
        if (!activeDocId) return;

        try {
          const updated = await window.api.vibecape.updateDoc(activeDocId, data);
          if (updated) {
            set({ activeDoc: updated });
            if (data.title && data.title !== activeDoc?.title) {
              const tree = await window.api.vibecape.getTree();
              set({ tree });
            }
          }
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      createDoc: async (data) => {
        set({ loading: true, error: undefined });
        try {
          const doc = await window.api.vibecape.createDoc({
            ...data,
            content: { type: "doc", content: [{ type: "paragraph" }] },
          });
          await get().refreshTree();
          return doc;
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      deleteDoc: async (id) => {
        set({ loading: true, error: undefined });
        try {
          await window.api.vibecape.deleteDoc(id);
          if (get().activeDocId === id) {
            set({ activeDocId: null, activeDoc: null });
          }
          await get().refreshTree();
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "vibecape_store",
      partialize: (state) => ({
        activeDocId: state.activeDocId,
      }),
    }
  )
);
