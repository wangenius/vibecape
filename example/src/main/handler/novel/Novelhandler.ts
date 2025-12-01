import { ipcMain } from "electron";
import {
  type Novel,
  type NovelInsert,
  type Chapter,
  type ChapterInsert,
  novels,
  chapters,
} from "@common/schema/novel";
import { cosmosManager } from "@main/utils/CosmosManager";
import { getCosmosDb } from "@main/db/cosmos";
import { desc, eq, asc } from "drizzle-orm";

// ==================== 小说相关操作 ====================

// 获取小说列表
ipcMain.handle("novel:list", async (): Promise<Record<string, Novel>> => {
  const cosmosId = cosmosManager.getCurrentCosmosId();
  if (!cosmosId) {
    // 没有打开的项目，返回空列表
    return {};
  }
  const db = getCosmosDb(cosmosId);

  const allNovels = await db
    .select()
    .from(novels)
    .orderBy(desc(novels.updated_at))
    .all();

  const novelsMap: Record<string, Novel> = {};
  for (const novel of allNovels) {
    novelsMap[novel.id] = novel;
  }

  return novelsMap;
});

// 获取单本小说
ipcMain.handle("novel:get", async (_, novelId: string) => {
  try {
    const cosmosId = cosmosManager.requireCurrentCosmos();
    const db = getCosmosDb(cosmosId);

    const novel = await db
      .select()
      .from(novels)
      .where(eq(novels.id, novelId))
      .get();

    return novel ?? null;
  } catch (error) {
    console.error("获取小说失败:", error);
    throw error;
  }
});

// 创建小说
ipcMain.handle(
  "novel:create",
  async (_, novelData: NovelInsert): Promise<Novel> => {
    const cosmosId = cosmosManager.getCurrentCosmosId();
    if (!cosmosId) {
      // 没有打开的项目，返回空列表
      throw new Error("没有打开的项目");
    }
    const db = getCosmosDb(cosmosId);

    // 插入小说元数据
    const [created] = await db.insert(novels).values(novelData).returning();

    return created;
  }
);

// 更新小说
ipcMain.handle(
  "novel:update",
  async (_, novelData: NovelInsert): Promise<Novel> => {
    try {
      const cosmosId = cosmosManager.requireCurrentCosmos();
      const db = getCosmosDb(cosmosId);

      if (!novelData.id) {
        throw new Error("小说 ID 不能为空");
      }

      // 更新小说元数据并返回更新后的数据
      const [updated] = await db
        .update(novels)
        .set({
          ...novelData,
          updated_at: Date.now(),
        })
        .where(eq(novels.id, novelData.id))
        .returning();

      return updated;
    } catch (error) {
      console.error("更新小说失败:", error);
      throw error;
    }
  }
);

// 删除小说
ipcMain.handle("novel:delete", async (_, novelId: string) => {
  try {
    const cosmosId = cosmosManager.requireCurrentCosmos();
    const db = getCosmosDb(cosmosId);
    await db.delete(novels).where(eq(novels.id, novelId));
    return { success: true };
  } catch (error) {
    console.error("删除小说失败:", error);
    throw error;
  }
});

// ==================== 章节相关操作 ====================

// 获取章节列表
ipcMain.handle(
  "chapter:list",
  async (_, novelId: string): Promise<Chapter[] | null> => {
    try {
      const cosmosId = cosmosManager.requireCurrentCosmos();
      const db = getCosmosDb(cosmosId);

      const novel = await db
        .select()
        .from(novels)
        .where(eq(novels.id, novelId))
        .get();

      if (!novel) {
        return null;
      }

      const novelChapters = await db
        .select()
        .from(chapters)
        .where(eq(chapters.novel_id, novelId))
        .orderBy(asc(chapters.order_index))
        .all();

      // 转换为 NovelProps 格式
      return novelChapters;
    } catch (error) {
      console.error("获取章节列表失败:", error);
      throw error;
    }
  }
);

// 获取单个章节
ipcMain.handle("chapter:get", async (_, chapterId: string) => {
  try {
    const cosmosId = cosmosManager.requireCurrentCosmos();
    const db = getCosmosDb(cosmosId);

    const chapter = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .get();

    if (!chapter) {
      return null;
    }

    return chapter;
  } catch (error) {
    console.error("获取章节失败:", error);
    throw error;
  }
});

// 创建章节
ipcMain.handle(
  "chapter:create",
  async (_, novelId: string, chapterData: Chapter): Promise<string> => {
    try {
      const cosmosId = cosmosManager.requireCurrentCosmos();
      const db = getCosmosDb(cosmosId);

      // 如果没有提供 order_index，则自动计算
      if (
        chapterData.order_index === undefined ||
        chapterData.order_index === null
      ) {
        const existingChapters = await db
          .select()
          .from(chapters)
          .where(eq(chapters.novel_id, novelId))
          .orderBy(desc(chapters.order_index))
          .limit(1)
          .all();

        const maxOrderIndex =
          existingChapters.length > 0 ? existingChapters[0].order_index : -1;
        chapterData.order_index = maxOrderIndex + 1;
      }

      await db.insert(chapters).values(chapterData);

      return chapterData.id;
    } catch (error) {
      console.error("创建章节失败:", error);
      throw error;
    }
  }
);

// 更新章节
ipcMain.handle(
  "chapter:update",
  async (_, chapterData: ChapterInsert): Promise<Chapter> => {
    try {
      const cosmosId = cosmosManager.requireCurrentCosmos();
      const db = getCosmosDb(cosmosId);

      if (!chapterData.id) {
        throw new Error("章节 ID 不能为空");
      }

      const [updatedChapter] = await db
        .update(chapters)
        .set({
          ...chapterData,
          updated_at: Date.now(),
        })
        .where(eq(chapters.id, chapterData.id))
        .returning();

      return updatedChapter;
    } catch (error) {
      console.error("更新章节失败:", error);
      throw error;
    }
  }
);

// 删除章节
ipcMain.handle("chapter:delete", async (_, chapterId: string) => {
  try {
    const cosmosId = cosmosManager.requireCurrentCosmos();
    const db = getCosmosDb(cosmosId);
    await db.delete(chapters).where(eq(chapters.id, chapterId));
    return { success: true };
  } catch (error) {
    console.error("删除章节失败:", error);
    throw error;
  }
});

// 重新排序章节
ipcMain.handle(
  "chapter:reorder",
  async (
    _,
    novelId: string,
    chapterIds: string[]
  ): Promise<{ success: boolean }> => {
    try {
      const cosmosId = cosmosManager.requireCurrentCosmos();
      const db = getCosmosDb(cosmosId);

      const novel = await db
        .select()
        .from(novels)
        .where(eq(novels.id, novelId))
        .get();

      if (!novel) {
        throw new Error("小说不存在");
      }

      // 批量更新章节顺序
      for (let i = 0; i < chapterIds.length; i++) {
        await db
          .update(chapters)
          .set({
            order_index: i,
            updated_at: Date.now(),
          })
          .where(eq(chapters.id, chapterIds[i]));
      }
      return { success: true };
    } catch (error) {
      console.error("章节排序失败:", error);
      throw error;
    }
  }
);
