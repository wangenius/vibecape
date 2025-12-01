import { create } from "zustand";
import type {
  DocStorySummary,
  DocStory,
  DocFile,
} from "@common/types/docs";

type DocsState = {
  root: string | null;
  stories: DocStorySummary[];
  activeStoryId: string | null;
  activeStory: DocStory | null;
  activePath: string | null;
  doc: DocFile | null;
  loading: boolean;
  error?: string;
};

type DocsActions = {
  bootstrap: () => Promise<void>;
  setRoot: (path: string) => Promise<void>;
  chooseRoot: () => Promise<void>;
  refreshStories: () => Promise<void>;
  openStory: (storyId: string) => Promise<void>;
  openDoc: (path: string) => Promise<void>;
  saveDoc: (
    content: string,
    metadata?: Record<string, any>
  ) => Promise<DocFile>;
};

export const useDocsStore = create<DocsState & DocsActions>((set, get) => ({
  root: null,
  stories: [],
  activeStoryId: null,
  activeStory: null,
  activePath: null,
  doc: null,
  loading: false,
  error: undefined,

  bootstrap: async () => {
    try {
      const root = await window.api.docs.getRoot();
      set({ root });
      if (root) {
        await get().refreshStories();
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  setRoot: async (path) => {
    set({ loading: true, error: undefined });
    try {
      const root = await window.api.docs.setRoot(path);
      set({
        root,
        stories: [],
        activeStoryId: null,
        activeStory: null,
        doc: null,
        activePath: null,
      });
      await get().refreshStories();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  chooseRoot: async () => {
    set({ loading: true, error: undefined });
    try {
      const chosen = await window.api.docs.chooseRoot();
      if (!chosen) return;
      set({
        root: chosen,
        stories: [],
        activeStoryId: null,
        activeStory: null,
        doc: null,
        activePath: null,
      });
      await get().refreshStories();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  refreshStories: async () => {
    const root = get().root;
    if (!root) {
      set({
        stories: [],
        activeStoryId: null,
        activeStory: null,
        doc: null,
        activePath: null,
      });
      return;
    }

    set({ loading: true, error: undefined });

    try {
      const stories = await window.api.docs.listStories();
      set({ stories });

      // 自动打开根目录 story
      if (stories.length > 0) {
        await get().openStory(stories[0].id);
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  openStory: async (storyId) => {
    set({ loading: true, error: undefined });
    try {
      const story = await window.api.docs.getStory(storyId);
      if (!story) {
        set({ error: "未找到 story" });
        return;
      }
      set({
        activeStoryId: storyId,
        activeStory: story,
        activePath: null,
        doc: null,
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  openDoc: async (path) => {
    const storyId = get().activeStoryId;
    if (!storyId) return;

    set({ loading: true, error: undefined });
    try {
      const doc = await window.api.docs.readDoc(storyId, path);
      set({
        activePath: path,
        doc,
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  saveDoc: async (content, metadata) => {
    const storyId = get().activeStoryId;
    const activePath = get().activePath;
    if (!storyId || !activePath) {
      throw new Error("没有选中的文档");
    }

    set({ loading: true, error: undefined });
    try {
      const saved = await window.api.docs.writeDoc(
        storyId,
        activePath,
        content,
        metadata
      );
      set({ doc: saved });
      return saved;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
