import { ipcMain } from "electron";
import { cosmosManager } from "../../utils/CosmosManager";
import { getCosmosDb } from "../../db/cosmos";
import { actantTypes } from "@common/schema/cosmos_bodies";
import type {
  ActantTypeInsert,
  ActantType,
} from "@common/schema/cosmos_bodies";
import { eq } from "drizzle-orm";

// ==================== ActantType API ====================

/**
 * 获取角色类型列表
 */
ipcMain.handle(
  "actantType:list",
  async (): Promise<Record<string, ActantType>> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      const typeList = await db.select().from(actantTypes).all();

      // 转换为 Record<string, ActantType>
      const result: Record<string, ActantType> = {};
      for (const type of typeList) {
        result[type.id] = type;
      }

      return result;
    } catch (error) {
      console.error("获取角色类型列表失败:", error);
      throw error;
    }
  }
);

/**
 * 获取单个角色类型
 */
ipcMain.handle(
  "actantType:get",
  async (_event, typeId: string): Promise<ActantType> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      const [type] = await db
        .select()
        .from(actantTypes)
        .where(eq(actantTypes.id, typeId))
        .limit(1)
        .all();

      if (!type) {
        throw new Error(`角色类型 ${typeId} 不存在`);
      }

      return type;
    } catch (error) {
      console.error("获取角色类型失败:", error);
      throw error;
    }
  }
);

/**
 * 创建角色类型
 */
ipcMain.handle(
  "actantType:create",
  async (_event, typeData: ActantTypeInsert): Promise<ActantType> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      const [created] = await db
        .insert(actantTypes)
        .values(typeData)
        .returning();

      return created;
    } catch (error) {
      console.error("创建角色类型失败:", error);
      throw error;
    }
  }
);

/**
 * 更新角色类型
 */
ipcMain.handle(
  "actantType:update",
  async (_event, typeData: ActantTypeInsert): Promise<ActantType> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");
      if (!typeData.id) throw new Error("角色类型 ID 不能为空");

      const db = getCosmosDb(cosmosId);

      const [updated] = await db
        .update(actantTypes)
        .set(typeData)
        .where(eq(actantTypes.id, typeData.id))
        .returning();

      return updated;
    } catch (error) {
      console.error("更新角色类型失败:", error);
      throw error;
    }
  }
);

/**
 * 删除角色类型
 */
ipcMain.handle(
  "actantType:delete",
  async (_event, typeId: string): Promise<{ success: boolean }> => {
    try {
      const cosmosId = await cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      await db.delete(actantTypes).where(eq(actantTypes.id, typeId)).run();

      return { success: true };
    } catch (error) {
      console.error("删除角色类型失败:", error);
      throw error;
    }
  }
);

console.log("ActantType IPC handlers registered");
