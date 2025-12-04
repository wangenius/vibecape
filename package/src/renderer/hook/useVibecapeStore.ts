import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JSONContent } from "@tiptap/core";
import type {
  DocTreeNode,
  DocData,
  VibecapeWorkspace,
} from "@common/schema/docs";
import type { WorkspaceHistoryItem } from "@common/api/vibecape";
import { initModels, initDefaultModels } from "@/hook/model/useModel";
import { initProviders } from "@/hook/model/useProvider";

type VibecapeState = {
  // 工作区
  workspace: VibecapeWorkspace | null;
  workspaceHistory: WorkspaceHistoryItem[];
  // 文档树
  tree: DocTreeNode[];
  // 当前选中的文档 ID
  activeDocId: string | null;
  // 当前文档数据
  activeDoc: DocData | null;
  // 加载状态
  loading: boolean;
  historyLoading: boolean;
  // 初始化进度信息
  initProgress: string | null;
  error?: string;
};

type VibecapeActions = {
  // 初始化
  bootstrap: () => Promise<void>;
  // 工作区操作
  createWorkspace: () => Promise<boolean>;
  openWorkspace: () => Promise<boolean>;
  openWorkspaceFromHistory: (docsDir: string) => Promise<boolean>;
  loadWorkspaceHistory: () => Promise<void>;
  removeWorkspaceFromHistory: (docsDir: string) => Promise<void>;
  closeWorkspace: () => Promise<void>;
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
  // 同步操作
  importFromDocs: () => Promise<{ imported: number }>;
  exportToDocs: () => Promise<{ exported: number }>;
};

export const useVibecapeStore = create<VibecapeState & VibecapeActions>()(
  persist(
    (set, get) => {
      const runInitWorkspace = async (docsDir: string) => {
        set({ loading: true, initProgress: "正在创建数据库...", error: undefined });
        try {
          const { workspace, needsImport } = await window.api.vibecape.initWorkspace(docsDir);
          set({ workspace, activeDocId: null, activeDoc: null });

          if (needsImport) {
            set({ initProgress: "正在解析 MDX 文档..." });
            await window.api.vibecape.importFromDocs();
          }

          set({ initProgress: "正在加载文档树..." });
          const tree = await window.api.vibecape.getTree();
          set({ tree, initProgress: null });
          await get().loadWorkspaceHistory();
          return true;
        } catch (error) {
          set({ error: (error as Error).message, initProgress: null });
          throw error;
        } finally {
          set({ loading: false, initProgress: null });
        }
      };

      return {
        workspace: null,
        workspaceHistory: [],
        tree: [],
        activeDocId: null,
        activeDoc: null,
        loading: false,
        historyLoading: false,
        initProgress: null,
        error: undefined,

        bootstrap: async () => {
          try {
            await Promise.all([initModels(), initDefaultModels(), initProviders()]);

            const workspace = await window.api.vibecape.getWorkspace();
            set({ workspace });
            await get().loadWorkspaceHistory();

            if (workspace?.initialized) {
              await get().refreshTree();
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

        loadWorkspaceHistory: async () => {
          set({ historyLoading: true });
          try {
            const workspaceHistory = await window.api.vibecape.getWorkspaceHistory();
            set({ workspaceHistory });
          } catch (error) {
            set({ error: (error as Error).message });
          } finally {
            set({ historyLoading: false });
          }
        },

        createWorkspace: async () => {
          set({ loading: true, error: undefined });
          try {
            const workspace = await window.api.vibecape.createWorkspace();
            if (workspace) {
              set({ workspace, tree: [], activeDocId: null, activeDoc: null });
              await get().loadWorkspaceHistory();
              return true;
            }
            return false;
          } catch (error) {
            set({ error: (error as Error).message });
            throw error;
          } finally {
            set({ loading: false });
          }
        },

        openWorkspace: async () => {
          const docsDir = await window.api.vibecape.pickDocsFolder();
          if (!docsDir) return false;
          return runInitWorkspace(docsDir);
        },

        openWorkspaceFromHistory: async (docsDir: string) => {
          if (!docsDir) return false;
          return runInitWorkspace(docsDir);
        },

        removeWorkspaceFromHistory: async (docsDir: string) => {
          await window.api.vibecape.removeWorkspaceFromHistory(docsDir);
          await get().loadWorkspaceHistory();
        },

        closeWorkspace: async () => {
          await window.api.app.settings.update(["general", "vibecapeRoot"], "");
          set({
            workspace: null,
            tree: [],
            activeDocId: null,
            activeDoc: null,
            error: undefined,
          });
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

        importFromDocs: async () => {
          set({ loading: true, error: undefined });
          try {
            const result = await window.api.vibecape.importFromDocs();
            await get().refreshTree();
            set({ activeDocId: null, activeDoc: null });
            return result;
          } catch (error) {
            set({ error: (error as Error).message });
            throw error;
          } finally {
            set({ loading: false });
          }
        },

        exportToDocs: async () => {
          set({ loading: true, error: undefined });
          try {
            const result = await window.api.vibecape.exportToDocs();
            return result;
          } catch (error) {
            set({ error: (error as Error).message });
            throw error;
          } finally {
            set({ loading: false });
          }
        },
      };
    },
    {
      name: "vibecape_store",
      partialize: (state) => ({
        activeDocId: state.activeDocId,
      }),
    }
  )
);
