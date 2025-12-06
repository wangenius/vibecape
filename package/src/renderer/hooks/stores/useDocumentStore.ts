import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JSONContent } from "@tiptap/core";
import type { DocTreeNode, DocData } from "@common/schema/docs";
import { useUIStore } from "./useUIStore";

// ============================================================================
// Document Store - 文档状态管理
// ============================================================================

type DocumentState = {
  tree: DocTreeNode[];
  activeDocId: string | null;
  activeDoc: DocData | null;
};

type DocumentActions = {
  refreshTree: () => Promise<void>;
  openDoc: (id: string) => Promise<void>;
  saveDoc: (
    docId: string,
    data: {
      title?: string;
      content?: JSONContent;
      metadata?: Record<string, any>;
    }
  ) => Promise<void>;
  createDoc: (data: {
    parent_id?: string | null;
    title: string;
  }) => Promise<DocData>;
  deleteDoc: (id: string) => Promise<void>;
  reset: () => void;
  restoreDoc: (docId: string) => Promise<void>;
};

export const useDocumentStore = create<DocumentState & DocumentActions>()(
  persist(
    (set, get) => ({
      tree: [],
      activeDocId: null,
      activeDoc: null,

      refreshTree: async () => {
        const uiStore = useUIStore.getState();
        uiStore.setLoading(true);
        uiStore.clearError();

        try {
          const tree = await window.api.vibecape.getTree();
          set({ tree });
        } catch (error) {
          uiStore.setError((error as Error).message);
        } finally {
          uiStore.setLoading(false);
        }
      },

      openDoc: async (id) => {
        const uiStore = useUIStore.getState();
        uiStore.setLoading(true);
        uiStore.clearError();

        try {
          const doc = await window.api.vibecape.getDoc(id);
          set({ activeDocId: id, activeDoc: doc });
        } catch (error) {
          uiStore.setError((error as Error).message);
        } finally {
          uiStore.setLoading(false);
        }
      },

      saveDoc: async (docId, data) => {
        const { activeDocId, activeDoc } = get();
        
        // 防止竞态条件：如果要保存的文档不是当前激活的文档，跳过保存
        // 这可能发生在快速切换文档时，旧文档的自动保存定时器触发
        if (docId !== activeDocId) {
          console.log('[saveDoc] 跳过过期保存:', { docId, activeDocId });
          return;
        }

        try {
          const updated = await window.api.vibecape.updateDoc(docId, data);
          if (updated) {
            // 再次检查：确保在保存完成后，当前文档仍然是被保存的文档
            if (get().activeDocId === docId) {
              set({ activeDoc: updated });
            }
            if (data.title !== undefined && data.title !== activeDoc?.title) {
              const tree = await window.api.vibecape.getTree();
              set({ tree });
            }
          }
        } catch (error) {
          useUIStore.getState().setError((error as Error).message);
          throw error;
        }
      },

      createDoc: async (data) => {
        const uiStore = useUIStore.getState();
        uiStore.setLoading(true);
        uiStore.clearError();

        try {
          const doc = await window.api.vibecape.createDoc({
            ...data,
            content: { type: "doc", content: [{ type: "paragraph" }] },
          });
          await get().refreshTree();
          return doc;
        } catch (error) {
          uiStore.setError((error as Error).message);
          throw error;
        } finally {
          uiStore.setLoading(false);
        }
      },

      deleteDoc: async (id) => {
        const uiStore = useUIStore.getState();
        uiStore.setLoading(true);
        uiStore.clearError();

        try {
          await window.api.vibecape.deleteDoc(id);
          if (get().activeDocId === id) {
            set({ activeDocId: null, activeDoc: null });
          }
          await get().refreshTree();
        } catch (error) {
          uiStore.setError((error as Error).message);
          throw error;
        } finally {
          uiStore.setLoading(false);
        }
      },

      reset: () => {
        set({ tree: [], activeDocId: null, activeDoc: null });
      },

      restoreDoc: async (docId: string) => {
        try {
          const doc = await window.api.vibecape.getDoc(docId);
          set({ activeDoc: doc });
        } catch {
          set({ activeDocId: null, activeDoc: null });
        }
      },
    }),
    {
      name: "document_store",
      partialize: (state) => ({
        activeDocId: state.activeDocId,
      }),
    }
  )
);
