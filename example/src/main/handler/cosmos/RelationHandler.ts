import { ipcMain } from "electron";
import { cosmosManager } from "../../utils/CosmosManager";
import { getCosmosDb } from "../../db/cosmos";
import { actantRelations } from "@common/schema/cosmos_bodies";
import type {
  ActantRelationInsert,
  ActantRelation,
} from "@common/schema/cosmos_bodies";
import { eq } from "drizzle-orm";

// ==================== Relation API ====================

/**
 * 获取关系列表
 */
ipcMain.handle(
  "relation:list",
  async (): Promise<Record<string, ActantRelation>> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      const relationList = await db.select().from(actantRelations).all();

      // 转换为 Record<string, ActantRelation>
      const result: Record<string, ActantRelation> = {};
      for (const relation of relationList) {
        result[relation.id] = relation;
      }

      return result;
    } catch (error) {
      console.error("获取关系列表失败:", error);
      throw error;
    }
  }
);

/**
 * 获取单个关系
 */
ipcMain.handle(
  "relation:get",
  async (_event, relationId: string): Promise<ActantRelation> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      const [relation] = await db
        .select()
        .from(actantRelations)
        .where(eq(actantRelations.id, relationId))
        .limit(1)
        .all();

      if (!relation) {
        throw new Error(`关系 ${relationId} 不存在`);
      }

      return relation;
    } catch (error) {
      console.error("获取关系失败:", error);
      throw error;
    }
  }
);

/**
 * 创建关系
 */
ipcMain.handle(
  "relation:create",
  async (_event, payload: ActantRelationInsert): Promise<ActantRelation> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      const [created] = await db
        .insert(actantRelations)
        .values(payload)
        .returning();

      return created;
    } catch (error) {
      console.error("创建关系失败:", error);
      throw error;
    }
  }
);

/**
 * 更新关系
 */
ipcMain.handle(
  "relation:update",
  async (_event, payload: ActantRelationInsert): Promise<ActantRelation> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");
      if (!payload.id) throw new Error("关系 ID 不能为空");

      const db = getCosmosDb(cosmosId);
      const [updated] = await db
        .update(actantRelations)
        .set(payload)
        .where(eq(actantRelations.id, payload.id))
        .returning();

      return updated;
    } catch (error) {
      console.error("更新关系失败:", error);
      throw error;
    }
  }
);

/**
 * 删除关系
 */
ipcMain.handle(
  "relation:delete",
  async (_event, id: string): Promise<{ success: boolean }> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      await db
        .delete(actantRelations)
        .where(eq(actantRelations.id, id))
        .returning();

      return { success: true as const };
    } catch (error) {
      console.error("删除关系失败:", error);
      throw error;
    }
  }
);

console.log("Relation IPC handlers registered");
