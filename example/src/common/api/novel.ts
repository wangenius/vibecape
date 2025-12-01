import {
  Chapter,
  ChapterInsert,
  Novel,
  NovelInsert,
} from "@common/schema/novel";

export interface NovelMetaAPI {
  /**
   * 获取小说列表
   */
  list: () => Promise<Record<string, Novel>>;
  /** 获取单本小说 */
  get: (id: string) => Promise<Novel | null>;
  /** 创建小说 */
  create: (payload: NovelInsert) => Promise<Novel>;
  /** 更新小说 */
  update: (payload: NovelInsert) => Promise<Novel>;
  /** 删除小说 */
  delete: (id: string) => Promise<{ success: boolean }>;
}

export interface ChapterAPI {
  /** 获取章节列表 */
  list: (novelId: string) => Promise<Chapter[]>;
  /** 创建章节 */
  create: (novelId: string, payload: ChapterInsert) => Promise<Chapter>;
  /** 更新章节 */
  update: (payload: ChapterInsert) => Promise<Chapter>;
  /** 删除章节 */
  delete: (id: string) => Promise<{ success: boolean }>;
  /** 重新排序章节 */
  reorder: (id: string, ids: string[]) => Promise<{ success: boolean }>;

  // chapter 相关的AI功能放到这里
}
