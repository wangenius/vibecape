import { ipcMain } from "electron";
import { cosmosManager } from "../../utils/CosmosManager";
import { getCosmosDb } from "../../db/cosmos";
import { stories } from "@common/schema/cosmos_bodies";
import type { StoryInsert, Story } from "@common/schema/cosmos_bodies";
import { eq } from "drizzle-orm";

// ==================== Story API ====================

/**
 * 获取故事列表
 */
ipcMain.handle("story:list", async (): Promise<Record<string, Story>> => {
  try {
    const cosmosId = cosmosManager.getCurrentCosmosId();
    if (!cosmosId) throw new Error("没有活动的项目");

    const db = getCosmosDb(cosmosId);
    const storyList = await db.select().from(stories).all();

    // 转换为 Record<string, Story>
    const result: Record<string, Story> = {};
    for (const story of storyList) {
      result[story.id] = story;
    }

    return result;
  } catch (error) {
    console.error("获取故事列表失败:", error);
    throw error;
  }
});

/**
 * 获取单个故事
 */
ipcMain.handle("story:get", async (_event, storyId: string): Promise<Story> => {
  try {
    const cosmosId = cosmosManager.getCurrentCosmosId();
    if (!cosmosId) throw new Error("没有活动的项目");

    const db = getCosmosDb(cosmosId);
    const [story] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1)
      .all();

    if (!story) {
      throw new Error(`故事 ${storyId} 不存在`);
    }

    return story;
  } catch (error) {
    console.error("获取故事失败:", error);
    throw error;
  }
});

/**
 * 创建故事
 */
ipcMain.handle(
  "story:create",
  async (_event, storyData: StoryInsert): Promise<Story> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);

      // 使用 returning() 直接获取插入后的完整数据（包括数据库生成的字段）
      const [created] = await db.insert(stories).values(storyData).returning();

      if (!created) {
        throw new Error("创建故事失败");
      }

      return created;
    } catch (error) {
      console.error("创建故事失败:", error);
      throw error;
    }
  }
);

/**
 * 更新故事
 */
ipcMain.handle(
  "story:update",
  async (_event, storyData: StoryInsert): Promise<Story> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");
      if (!storyData.id) throw new Error("故事 ID 不能为空");

      const db = getCosmosDb(cosmosId);

      const [updated] = await db
        .update(stories)
        .set(storyData)
        .where(eq(stories.id, storyData.id))
        .returning();

      return updated;
    } catch (error) {
      console.error("更新故事失败:", error);
      throw error;
    }
  }
);

/**
 * 删除故事
 */
ipcMain.handle(
  "story:delete",
  async (_event, storyId: string): Promise<{ success: boolean }> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      await db.delete(stories).where(eq(stories.id, storyId)).run();

      return { success: true };
    } catch (error) {
      console.error("删除故事失败:", error);
      throw error;
    }
  }
);

console.log("Story IPC handlers registered");
