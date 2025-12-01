/**
 * Story - 剧情管理
 * 包含 Slice + 业务逻辑
 */

import { Story, StoryInsert } from "@common/schema";

export interface Clue {
  id: string;
  name: string;
  description: string;
  type: "character" | "item" | "event" | "location" | "mystery";
  status: "hidden" | "revealed" | "resolved";
  relatedClues: string[];
  color: string;
}

// ==================== 类型定义 ====================

export interface StorySlice {
  stories: Record<string, Story>;
  setStories: (stories: Record<string, Story>) => void;
  insertStory: (story?: StoryInsert) => void;
  updateStory: (id: string, updates: StoryInsert) => void;
  removeStory: (id: string) => void;
}

// ==================== Slice Creator ====================

export const createStorySlice = (set: any, _: any): StorySlice => ({
  stories: {},

  setStories: (stories) =>
    set(() => ({
      stories,
    })),

  insertStory: async (story = {}) => {
    const newStory = await window.api.cosmos.story.create(story);
    set((state: StorySlice) => ({
      stories: {
        ...state.stories,
        [newStory.id]: newStory,
      },
    }));
  },

  updateStory: async (id, updates) => {
    const updatedStory = await window.api.cosmos.story.update({
      id,
      ...updates,
    });
    set((state: StorySlice) => ({
      stories: {
        ...state.stories,
        [id]: updatedStory,
      },
    }));
  },

  removeStory: async (id) => {
    const deletedStory = await window.api.cosmos.story.delete(id);
    if (deletedStory.success) {
      set((state: StorySlice) => {
        const newStories = { ...state.stories };
        delete newStories[id];
        return { stories: newStories };
      });
    }
  },
});
