import { ipcMain } from "electron";
import { cosmosManager } from "../../utils/CosmosManager";
import { getCosmosDb } from "../../db/cosmos";
import { loreTypes } from "@common/schema/cosmos_bodies";
import type { LoreTypeInsert, LoreType } from "@common/schema/cosmos_bodies";
import { eq } from "drizzle-orm";

// ==================== LoreType API ====================

/**
 * 获取设定类型列表
 */
ipcMain.handle("loreType:list", async (): Promise<Record<string, LoreType>> => {
  try {
    const cosmosId = cosmosManager.getCurrentCosmosId();
    if (!cosmosId) throw new Error("没有活动的项目");

    const db = getCosmosDb(cosmosId);
    const typeList = await db.select().from(loreTypes).all();

    // 转换为 Record<string, LoreType>
    const result: Record<string, LoreType> = {};
    for (const type of typeList) {
      result[type.id] = type;
    }

    return result;
  } catch (error) {
    console.error("获取设定类型列表失败:", error);
    throw error;
  }
});

/**
 * 获取单个设定类型
 */
ipcMain.handle(
  "loreType:get",
  async (_event, typeId: string): Promise<LoreType> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      const [type] = await db
        .select()
        .from(loreTypes)
        .where(eq(loreTypes.id, typeId))
        .limit(1)
        .all();

      if (!type) {
        throw new Error(`设定类型 ${typeId} 不存在`);
      }

      return type;
    } catch (error) {
      console.error("获取设定类型失败:", error);
      throw error;
    }
  }
);

/**
 * 创建设定类型
 */
ipcMain.handle(
  "loreType:create",
  async (_event, typeData: LoreTypeInsert): Promise<LoreType> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      const [created] = await db.insert(loreTypes).values(typeData).returning();

      return created;
    } catch (error) {
      console.error("创建设定类型失败:", error);
      throw error;
    }
  }
);

/**
 * 更新设定类型
 */
ipcMain.handle(
  "loreType:update",
  async (_event, typeData: LoreTypeInsert): Promise<LoreType> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");
      if (!typeData.id) throw new Error("设定类型 ID 不能为空");

      const db = getCosmosDb(cosmosId);

      const [updated] = await db
        .update(loreTypes)
        .set(typeData)
        .where(eq(loreTypes.id, typeData.id))
        .returning();

      return updated;
    } catch (error) {
      console.error("更新设定类型失败:", error);
      throw error;
    }
  }
);

/**
 * 删除设定类型
 */
ipcMain.handle(
  "loreType:delete",
  async (_event, typeId: string): Promise<{ success: boolean }> => {
    try {
      const cosmosId = await cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      await db.delete(loreTypes).where(eq(loreTypes.id, typeId)).run();

      return { success: true };
    } catch (error) {
      console.error("删除设定类型失败:", error);
      throw error;
    }
  }
);

console.log("LoreType IPC handlers registered");
