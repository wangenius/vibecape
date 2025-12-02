import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JSONContent } from "@tiptap/core";
import type {
  DocTreeNode,
  DocData,
  VibecapeWorkspace,
} from "@common/schema/docs";
import { initModels, initDefaultModels } from "@/hook/model/useModel";
import { initProviders } from "@/hook/model/useProvider";

type VibecapeState = {
  // 工作区
  workspace: VibecapeWorkspace | null;
  // 文档树
  tree: DocTreeNode[];
  // 当前选中的文档 ID
  activeDocId: string | null;
  // 当前文档数据
  activeDoc: DocData | null;
  // 加载状态
  loading: boolean;
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
    (set, get) => ({
      workspace: null,
      tree: [],
      activeDocId: null,
      activeDoc: null,
      loading: false,
      initProgress: null,
      error: undefined,

      bootstrap: async () => {
        try {
          // 并行初始化模型和 Provider 数据
          await Promise.all([
            initModels(),
            initDefaultModels(),
            initProviders(),
          ]);

          const workspace = await window.api.vibecape.getWorkspace();
          set({ workspace });

          if (workspace?.initialized) {
            await get().refreshTree();
            // 恢复上次打开的文档
            const { activeDocId } = get();
            if (activeDocId) {
              try {
                const doc = await window.api.vibecape.getDoc(activeDocId);
                set({ activeDoc: doc });
              } catch {
                // 文档不存在，清除
                set({ activeDocId: null, activeDoc: null });
              }
            }
          }
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

    createWorkspace: async () => {
      set({ loading: true, error: undefined });
      try {
        const workspace = await window.api.vibecape.createWorkspace();
        if (workspace) {
          set({ workspace, tree: [], activeDocId: null, activeDoc: null });
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
      // 第一步：选择文件夹（不显示 loading）
      const docsDir = await window.api.vibecape.pickDocsFolder();
      if (!docsDir) return false;

      // 第二步：初始化工作区（显示 loading 和进度）
      set({ loading: true, initProgress: "正在创建数据库...", error: undefined });
      try {
        const { workspace, needsImport } = await window.api.vibecape.initWorkspace(docsDir);
        set({ workspace, activeDocId: null, activeDoc: null });

        // 如果是新工作区，自动导入现有 MDX 文件
        if (needsImport) {
          set({ initProgress: "正在解析 MDX 文档..." });
          await window.api.vibecape.importFromDocs();
        }

        // 加载文档树
        set({ initProgress: "正在加载文档树..." });
        const tree = await window.api.vibecape.getTree();
        set({ tree, initProgress: null });
        return true;
      } catch (error) {
        set({ error: (error as Error).message, initProgress: null });
        throw error;
      } finally {
        set({ loading: false, initProgress: null });
      }
    },

    closeWorkspace: async () => {
      // 清除设置中的 vibecapeRoot
      await window.api.app.settings.update(
        ["general", "vibecapeRoot"],
        ""
      );
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
      const { activeDocId } = get();
      if (!activeDocId) return;

      set({ loading: true, error: undefined });
      try {
        const updated = await window.api.vibecape.updateDoc(activeDocId, data);
        if (updated) {
          set({ activeDoc: updated });
          // 如果 title 变了，刷新树
          if (data.title) {
            await get().refreshTree();
          }
        }
      } catch (error) {
        set({ error: (error as Error).message });
        throw error;
      } finally {
        set({ loading: false });
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
        // 如果删除的是当前文档，清空选中
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
    }),
    {
      name: "vibecape_store",
      partialize: (state) => ({
        activeDocId: state.activeDocId,
      }),
    }
  )
);
