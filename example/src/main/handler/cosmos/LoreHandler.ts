import { ipcMain } from "electron";
import { cosmosManager } from "../../utils/CosmosManager";
import { getCosmosDb } from "../../db/cosmos";
import { lores } from "@common/schema/cosmos_bodies";
import type { LoreInsert, Lore } from "@common/schema/cosmos_bodies";
import { eq } from "drizzle-orm";

// ==================== Lore API ====================

/**
 * 获取设定列表
 */
ipcMain.handle("lore:list", async (): Promise<Record<string, Lore>> => {
  try {
    const cosmosId = cosmosManager.getCurrentCosmosId();
    if (!cosmosId) throw new Error("没有活动的项目");

    const db = getCosmosDb(cosmosId);
    const loreList = await db.select().from(lores).all();

    // 转换为 Record<string, Lore>
    const result: Record<string, Lore> = {};
    for (const lore of loreList) {
      result[lore.id] = lore;
    }

    return result;
  } catch (error) {
    console.error("获取设定列表失败:", error);
    throw error;
  }
});

/**
 * 获取单个设定
 */
ipcMain.handle("lore:get", async (_event, loreId: string): Promise<Lore> => {
  try {
    const cosmosId = cosmosManager.getCurrentCosmosId();
    if (!cosmosId) throw new Error("没有活动的项目");

    const db = getCosmosDb(cosmosId);
    const [lore] = await db
      .select()
      .from(lores)
      .where(eq(lores.id, loreId))
      .limit(1)
      .all();

    if (!lore) {
      throw new Error(`设定 ${loreId} 不存在`);
    }

    return lore;
  } catch (error) {
    console.error("获取设定失败:", error);
    throw error;
  }
});

/**
 * 创建设定
 */
ipcMain.handle(
  "lore:create",
  async (_event, loreData: LoreInsert): Promise<Lore> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      const [created] = await db.insert(lores).values(loreData).returning();

      return created;
    } catch (error) {
      console.error("创建设定失败:", error);
      throw error;
    }
  }
);

/**
 * 更新设定
 */
ipcMain.handle(
  "lore:update",
  async (_event, loreData: LoreInsert): Promise<Lore> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");
      if (!loreData.id) throw new Error("设定 ID 不能为空");

      const db = getCosmosDb(cosmosId);

      const [updatedLore] = await db
        .update(lores)
        .set(loreData)
        .where(eq(lores.id, loreData.id))
        .returning();

      return updatedLore;
    } catch (error) {
      console.error("更新设定失败:", error);
      throw error;
    }
  }
);

/**
 * 删除设定
 */
ipcMain.handle(
  "lore:delete",
  async (_event, loreId: string): Promise<{ success: boolean }> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      await db.delete(lores).where(eq(lores.id, loreId)).returning();

      return { success: true };
    } catch (error) {
      console.error("删除设定失败:", error);
      throw error;
    }
  }
);

console.log("Lore IPC handlers registered");
