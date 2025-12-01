/**
 * Novel Store - 小说数据统一管理
 * 整合所有模块的 Slices
 */

import { create } from "zustand";
import { toast } from "sonner";
import { gen } from "@common/lib/generator";
import type { Novel, Chapter } from "@common/schema/novel";

// 导入各模块的 Slice
import { createNovelMetaSlice, type NovelMetaSlice } from "./useNovelMeta";
import {
  createChapterSlice,
  type ChapterSlice,
  createChapterInstance,
} from "./useChapter";
import { TiptapProse } from "@/components/editor/TiptapProse";
import { createDebounceSave } from "@/hook/util/useSaveQueue";

// ==================== Store 定义 ====================

type NovelStore = NovelMetaSlice & ChapterSlice;

export const useNovelStore = create<NovelStore>()((set, get) => ({
  // 合并所有 Slices
  ...createNovelMetaSlice(set),
  ...createChapterSlice(set, get),
}));

// ==================== 防抖保存器 ====================

/** 小说元数据保存器 */
const novelSaver = createDebounceSave(async (novel: Novel) => {
  try {
    await window.api.novel.meta.update(novel);
    console.log(`[Novel] 保存小说成功: ${novel.name}`);
  } catch (error) {
    console.error("[Novel] 保存小说失败:", error);
    toast.error("保存小说失败", {
      description: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

/** 章节保存器 */
const chapterSaver = createDebounceSave(async (chapter: Chapter) => {
  try {
    await window.api.novel.chapter.update(chapter);
    console.log(`[Novel] 保存章节成功: ${chapter.name}`);
  } catch (error) {
    console.error("[Novel] 保存章节失败:", error);
    toast.error("保存章节失败", {
      description: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

// ==================== Hooks ====================

/** Hook: 获取当前小说 */
export function useNovel<T = Novel | null>(
  selector?: (novel: NonNullable<NovelMetaSlice["currentNovel"]>) => T
): T {
  return useNovelStore((state) => {
    const current = state.currentNovel;
    if (!current) return (selector ? undefined : null) as T;
    return selector ? selector(current) : (current as unknown as T);
  });
}

/** Hook: 获取小说列表 */
export function useNovelList() {
  return useNovelStore((state) => state.novelList);
}

/** Hook: 获取章节列表 */
export function useChapterList() {
  return useNovelStore((state) => state.chapters);
}

/** Hook: 获取当前章节索引 */
export function useChapterIndex() {
  return useNovelStore((state) => state.currentChapterIndex);
}

/** Hook: 获取当前章节 */
export function useCurrentChapter() {
  const index = useNovelStore((state) => state.currentChapterIndex);
  const chapters = useNovelStore((state) => state.chapters);
  const chapter =
    index >= 0 && index < chapters.length ? chapters[index] : null;
  return { index, chapter, chapters };
}

// ==================== 工具函数（非响应式） ====================

/** 获取当前小说（非响应式） */
export function getCurrentNovel(): Novel | null {
  return useNovelStore.getState().currentNovel;
}

/** 获取小说列表（非响应式） */
export function getNovelList(): Record<string, Novel> {
  return useNovelStore.getState().novelList;
}

/** 获取章节列表（非响应式） */
export function getChapterList(): Chapter[] {
  return useNovelStore.getState().chapters;
}

/** 获取当前章节索引（非响应式） */
export function getCurrentChapterIndex(): number {
  return useNovelStore.getState().currentChapterIndex;
}

/** 获取当前章节（非响应式） */
export function getCurrentChapter(): Chapter | null {
  const state = useNovelStore.getState();
  const index = state.currentChapterIndex;
  return index >= 0 && index < state.chapters.length
    ? state.chapters[index]
    : null;
}

/** 获取指定索引的章节（非响应式） */
export function getChapterByIndex(index: number): Chapter | null {
  const chapters = getChapterList();
  return index >= 0 && index < chapters.length ? chapters[index] : null;
}

/** 立即保存小说元数据 */
export async function saveNovelNow() {
  await novelSaver.saveNow();
}

/** 立即保存章节 */
export async function saveChapterNow() {
  await chapterSaver.saveNow();
}

// ==================== 小说操作函数 ====================

/** 从后端同步小说列表 */
export async function syncNovelList() {
  try {
    const novels = await window.api.novel.meta.list();
    useNovelStore.getState().setNovelList(novels);
  } catch (error) {
    console.error("同步小说列表失败:", error);
    throw error;
  }
}

/** 打开小说 */
export async function openNovel(id: string): Promise<void> {
  const currentNovel = getCurrentNovel();

  /* 如果是同一本小说，直接返回 */
  if (currentNovel?.id === id) {
    return;
  }

  try {
    // 从后端获取小说元数据
    const novelMeta = await window.api.novel.meta.get(id);

    if (!novelMeta) {
      throw new Error("小说不存在");
    }

    // 设置当前小说
    useNovelStore.getState().setCurrentNovel(novelMeta);

    // 获取并设置章节列表
    const chapters = await window.api.novel.chapter.list(id);
    useNovelStore.getState().setChapters(chapters || []);
    // 重置章节索引
    useNovelStore.getState().setCurrentChapterIndex(0);
  } catch (error) {
    console.error("打开小说失败:", error);
    toast.error("打开小说失败", {
      description: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/** 关闭小说 */
export async function closeNovel() {
  useNovelStore.getState().setCurrentNovel(null);
  useNovelStore.getState().setChapters([]);
  useNovelStore.getState().setCurrentChapterIndex(0);
}

/** 创建小说 */
export async function createNovel(
  data: Partial<Omit<Novel, "id">>
): Promise<Novel> {
  try {
    const novelId = gen.id();

    const novel: Novel = {
      id: novelId,
      name: data.name || "",
      description: data.description || "",
      cover: data.cover || "",
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    // 调用后端API创建小说
    await window.api.novel.meta.create(novel);

    // 更新本地缓存
    const currentList = getNovelList();
    useNovelStore.getState().setNovelList({
      ...currentList,
      [novelId]: novel,
    });

    // 设置为当前小说
    useNovelStore.getState().setCurrentNovel(novel);

    // 自动创建第一个章节
    const firstChapter = createChapterInstance({
      novel_id: novelId,
      order_index: 0,
    });
    await window.api.novel.chapter.create(novelId, firstChapter);
    useNovelStore.getState().setChapters([firstChapter]);
    useNovelStore.getState().setCurrentChapterIndex(0);

    toast.success("创建小说成功");
    return novel;
  } catch (e) {
    toast.error(String(e));
    throw e;
  }
}

/** 删除小说 */
export async function deleteNovel(novel: Novel): Promise<void> {
  try {
    // 如果是当前小说，先关闭
    const currentNovel = getCurrentNovel();
    if (currentNovel?.id === novel.id) {
      await closeNovel();

      // 关闭标签
      const { closeTab } = await import("@/hook/app/useViewManager");
      closeTab(`novel:${novel.id}`);
    }

    // 调用后端API删除
    await window.api.novel.meta.delete(novel.id);

    // 更新本地缓存
    const currentList = getNovelList();
    const newList = { ...currentList };
    delete newList[novel.id];
    useNovelStore.getState().setNovelList(newList);

    toast.success(`删除小说[${novel.name}]成功`);
  } catch (e) {
    toast.error(String(e));
    throw e;
  }
}

/** 更新小说元数据 */
export async function updateNovelMeta(meta: Partial<Novel>): Promise<void> {
  const novel = getCurrentNovel();
  if (!novel) return;

  const newMeta: Novel = {
    ...novel,
    ...meta,
    updated_at: Date.now(),
  };

  /* 更新当前小说 */
  useNovelStore.getState().setCurrentNovel(newMeta);

  /* 更新列表中的元数据 */
  const currentList = getNovelList();
  useNovelStore.getState().setNovelList({
    ...currentList,
    [newMeta.id]: newMeta,
  });

  // 如果标题有更新，同步更新相关的标签标题
  if (meta.name) {
    const { updateTabTitle, getCurrentViewManager } = await import(
      "@/hook/app/useViewManager"
    );
    const viewManager = getCurrentViewManager();

    const novelTabId = `novel:${novel.id}`;
    const novelTab = viewManager.tabs.find((tab) => tab.id === novelTabId);

    if (novelTab) {
      updateTabTitle(novelTabId, meta.name);
    }
  }

  // 保存到后端
  novelSaver.save(newMeta);
}

/** 导出小说为txt */
export function exportNovelAsTxt(): void {
  const novel = getCurrentNovel();
  if (!novel) return;

  const chapters = getChapterList();

  const meta = [
    "------jezzlab.com------",
    `[小说]${novel.name}`,
    `[作者]匿名`,
    `[简介]${novel.description}`,
    "------jezzlab.com------",
  ].join("\n");

  const content = chapters
    .map(
      (chapter, index) =>
        `\n【第${index + 1}章】${chapter.name}\n${TiptapProse.flatten(chapter.body)}\n`
    )
    .join("\n\n");

  (meta + content).download(novel.name || "小说");
}

// ==================== 章节操作函数 ====================

/** 跳转到指定章节 */
export async function goToChapter(index: number): Promise<void> {
  const novel = getCurrentNovel();
  if (!novel) return;

  const chapters = getChapterList();
  if (index < 0 || index > chapters.length) return;

  // 如果跳转到末尾之后，创建新章节
  if (index === chapters.length) {
    await createChapter();
  }

  useNovelStore.getState().setCurrentChapterIndex(index);
}

/** 创建新章节 */
export async function createChapter(
  props?: Partial<Chapter>,
  index?: number
): Promise<Chapter> {
  try {
    const novel = getCurrentNovel();
    if (!novel) throw new Error("未打开小说");

    const chapters = getChapterList();

    // 确保索引在有效范围内
    const validIndex =
      index !== undefined
        ? Math.max(0, Math.min(index, chapters.length))
        : chapters.length;

    const newChapter = createChapterInstance({
      ...props,
      novel_id: novel.id,
      order_index: validIndex,
    });

    // 插入章节
    useNovelStore.getState().insertChapter(validIndex);
    // 跳转到新章节
    useNovelStore.getState().setCurrentChapterIndex(validIndex);

    return newChapter;
  } catch (e) {
    toast.error(String(e));
    throw e;
  }
}

/** 更新指定索引的章节 */
export function updateChapterByIndex(
  index: number,
  updates: Partial<Chapter>
): void {
  useNovelStore.getState().updateChapterByIndex(index, updates);

  const chapters = getChapterList();
  const chapter = chapters[index];
  if (chapter) {
    chapterSaver.save(chapter);
  }
}

/** 更新指定ID的章节 */
export function updateChapterById(id: string, updates: Partial<Chapter>): void {
  useNovelStore.getState().updateChapterById(id, updates);

  const chapters = getChapterList();
  const chapter = chapters.find((c) => c.id === id);
  if (chapter) {
    chapterSaver.save(chapter);
  }
}

/** 删除指定索引的章节 */
export async function deleteChapterByIndex(index: number): Promise<void> {
  const chapters = getChapterList();
  const chapter = chapters[index];
  if (!chapter) return;

  useNovelStore.getState().removeChapterByIndex(index);
  await window.api.novel.chapter.delete(chapter.id);
}

/** 删除指定ID的章节 */
export async function deleteChapterById(id: string): Promise<void> {
  const chapters = getChapterList();
  const index = chapters.findIndex((c) => c.id === id);
  if (index === -1) return;

  await deleteChapterByIndex(index);
}

// ==================== 初始化 ====================

/** 初始化小说列表 */
export async function initNovels() {
  try {
    await syncNovelList();
  } catch (error) {
    console.error("初始化小说失败:", error);
  }
}

// 自动初始化
initNovels();
