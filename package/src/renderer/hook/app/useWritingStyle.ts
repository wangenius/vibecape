import { create } from "zustand";
import type { WritingStyle, WritingStyleInsert } from "@common/schema/app";
import { gen } from "@common/lib/generator";
import { getShape } from "@common/lib/shape";
import { settingsShape } from "@common/config/settings";
import { API } from "@/lib/client";

// ==================== Zustand Store ====================

interface WritingStyleStore {
  // 风格列表
  styles: WritingStyle[];
  // 当前选择的风格ID
  selectedId: string;
  // Actions
  setStyles: (styles: WritingStyle[]) => void;
  setSelectedId: (id: string) => void;
  upsertStyle: (style: WritingStyle) => void;
  removeStyle: (id: string) => void;
}

const useWritingStyleStore = create<WritingStyleStore>((set) => ({
  styles: [],
  selectedId: "default",
  setStyles: (styles) => set({ styles }),
  setSelectedId: (id) => set({ selectedId: id }),
  upsertStyle: (style) =>
    set((state) => {
      const index = state.styles.findIndex((s) => s.id === style.id);
      if (index >= 0) {
        // 更新已存在的
        const newStyles = [...state.styles];
        newStyles[index] = style;
        return { styles: newStyles };
      } else {
        // 添加新的
        return { styles: [...state.styles, style] };
      }
    }),
  removeStyle: (id) =>
    set((state) => {
      const newStyles = state.styles.filter((s) => s.id !== id);
      return {
        styles: newStyles,
        // 如果删除的是当前选中的风格，切换到第一个或 default
        selectedId:
          state.selectedId === id
            ? newStyles[0]?.id || "default"
            : state.selectedId,
      };
    }),
}));

// ==================== Hooks ====================

/** 使用写作风格 store */
export function useWritingStyle() {
  return useWritingStyleStore();
}

/** 获取所有风格列表 */
export function useWritingStyleList() {
  return useWritingStyleStore((state) => state.styles);
}

/** 获取指定风格 */
export function useWritingStyleById(id: string) {
  return useWritingStyleStore((state) => state.styles.find((s) => s.id === id));
}

/** 获取当前选择的风格ID */
export function useSelectedStyleId() {
  return useWritingStyleStore((state) => state.selectedId);
}

/** 获取当前选择的风格 */
export function useSelectedStyle() {
  return useWritingStyleStore((state) =>
    state.styles.find((s) => s.id === state.selectedId)
  );
}

// ==================== 工具函数 ====================

/** 获取所有风格（非响应式） */
export function getWritingStyleList(): WritingStyle[] {
  return useWritingStyleStore.getState().styles;
}

/** 获取指定风格（非响应式） */
export function getWritingStyleById(id: string): WritingStyle | undefined {
  return useWritingStyleStore.getState().styles.find((s) => s.id === id);
}

/** 获取当前风格（非响应式） */
export function getSelectedStyle(): WritingStyle | undefined {
  const { styles, selectedId } = useWritingStyleStore.getState();
  return styles.find((s) => s.id === selectedId);
}

/** 获取当前选择的风格ID（非响应式） */
export function getSelectedStyleId(): string {
  return useWritingStyleStore.getState().selectedId;
}

// ==================== 操作函数 ====================

/** 刷新写作风格列表（从后端加载） */
export async function refreshWritingStyles() {
  try {
    const [styles, settings] = await Promise.all([
      API.app.writingStyle.getAll(),
      API.app.settings.get(),
    ]);

    useWritingStyleStore.getState().setStyles(styles);
    const selectedId =
      settings?.novel?.selectedNovelStyleId ||
      useWritingStyleStore.getState().selectedId ||
      "default";
    useWritingStyleStore.getState().setSelectedId(selectedId);

    return { styles, selectedId };
  } catch (error) {
    console.error("刷新写作风格失败:", error);
    return { styles: getWritingStyleList(), selectedId: getSelectedStyleId() };
  }
}

/** 选择风格 */
export async function selectWritingStyle(id: string) {
  await API.app.settings.update(
    getShape(settingsShape.novel.selectedNovelStyleId),
    id
  );
  useWritingStyleStore.getState().setSelectedId(id);
}

/** 添加风格 */
export async function addWritingStyle(
  data: Omit<WritingStyleInsert, "id" | "created_at" | "updated_at">
) {
  const payload: WritingStyleInsert = {
    id: gen.id(),
    ...data,
  };
  const result = await API.app.writingStyle.create(payload);
  useWritingStyleStore.getState().upsertStyle(result);
  return result;
}

/** 更新风格 */
export async function updateWritingStyle(style: WritingStyleInsert) {
  if (!style.id) {
    throw new Error("风格 ID 不存在，无法更新");
  }
  const result = await API.app.writingStyle.update(style.id, style);
  useWritingStyleStore.getState().upsertStyle(result);
  return result;
}

/** 删除风格 */
export async function deleteWritingStyle(id: string) {
  await API.app.writingStyle.delete(id);
  useWritingStyleStore.getState().removeStyle(id);
}

/** 初始化写作风格 */
export async function initWritingStyles() {
  try {
    await refreshWritingStyles();
  } catch (error) {
    console.error("初始化写作风格失败:", error);
  }
}

// 初始化
void initWritingStyles();
