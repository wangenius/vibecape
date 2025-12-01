import { ipcMain } from "electron";
import { cosmosManager } from "../../utils/CosmosManager";
import { getCosmosDb } from "../../db/cosmos";
import { actantStates } from "@common/schema/cosmos_bodies";
import type {
  ActantStateInsert,
  ActantState,
} from "@common/schema/cosmos_bodies";
import { eq } from "drizzle-orm";

// ==================== ActantState API ====================

/**
 * 获取角色状态列表
 */
ipcMain.handle(
  "actantState:list",
  async (): Promise<Record<string, ActantState>> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      const stateList = await db.select().from(actantStates).all();

      // 转换为 Record<string, ActantState>
      const result: Record<string, ActantState> = {};
      for (const state of stateList) {
        result[state.id] = state;
      }

      return result;
    } catch (error) {
      console.error("获取角色状态列表失败:", error);
      throw error;
    }
  }
);

/**
 * 获取单个角色状态
 */
ipcMain.handle(
  "actantState:get",
  async (_event, stateId: string): Promise<ActantState> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      const [state] = await db
        .select()
        .from(actantStates)
        .where(eq(actantStates.id, stateId))
        .limit(1)
        .all();

      if (!state) {
        throw new Error(`角色状态 ${stateId} 不存在`);
      }

      return state;
    } catch (error) {
      console.error("获取角色状态失败:", error);
      throw error;
    }
  }
);

/**
 * 创建角色状态
 */
ipcMain.handle(
  "actantState:create",
  async (_event, stateData: ActantStateInsert): Promise<ActantState> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      const [created] = await db
        .insert(actantStates)
        .values(stateData)
        .returning();

      return created;
    } catch (error) {
      console.error("创建角色状态失败:", error);
      throw error;
    }
  }
);

/**
 * 更新角色状态
 */
ipcMain.handle(
  "actantState:update",
  async (
    _event,
    stateData: ActantStateInsert
  ): Promise<{ success: boolean }> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");
      if (!stateData.id) throw new Error("角色状态 ID 不能为空");

      const db = getCosmosDb(cosmosId);

      await db
        .update(actantStates)
        .set(stateData)
        .where(eq(actantStates.id, stateData.id))
        .run();

      return { success: true };
    } catch (error) {
      console.error("更新角色状态失败:", error);
      throw error;
    }
  }
);

/**
 * 删除角色状态
 */
ipcMain.handle(
  "actantState:delete",
  async (_event, stateId: string): Promise<{ success: boolean }> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      await db
        .delete(actantStates)
        .where(eq(actantStates.id, stateId))
        .returning();

      return { success: true };
    } catch (error) {
      console.error("删除角色状态失败:", error);
      throw error;
    }
  }
);

console.log("ActantState IPC handlers registered");
