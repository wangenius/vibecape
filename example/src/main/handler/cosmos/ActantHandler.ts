import { ipcMain } from "electron";
import { cosmosManager } from "../../utils/CosmosManager";
import { getCosmosDb } from "../../db/cosmos";
import { actants, actantStates } from "@common/schema/cosmos_bodies";
import type {
  ActantInsert,
  Actant,
  ActantState,
} from "@common/schema/cosmos_bodies";
import { eq } from "drizzle-orm";

// ==================== Actant API ====================

/**
 * 获取角色列表
 */
ipcMain.handle("actant:list", async (): Promise<Record<string, Actant>> => {
  try {
    const cosmosId = cosmosManager.getCurrentCosmosId();
    if (!cosmosId) throw new Error("没有活动的项目");

    const db = getCosmosDb(cosmosId);
    const actantList = await db.select().from(actants).all();

    // 转换为 Record<string, Actant>
    const result: Record<string, Actant> = {};
    for (const actant of actantList) {
      result[actant.id] = actant;
    }

    return result;
  } catch (error) {
    console.error("获取角色列表失败:", error);
    throw error;
  }
});

/**
 * 获取单个角色
 */
ipcMain.handle(
  "actant:get",
  async (_event, actantId: string): Promise<Actant> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      const [actant] = await db
        .select()
        .from(actants)
        .where(eq(actants.id, actantId))
        .limit(1)
        .all();

      if (!actant) {
        throw new Error(`角色 ${actantId} 不存在`);
      }

      return actant;
    } catch (error) {
      console.error("获取角色失败:", error);
      throw error;
    }
  }
);

/**
 * 创建角色
 */
ipcMain.handle(
  "actant:create",
  async (
    _event,
    actantData: ActantInsert
  ): Promise<{ actant: Actant; state: ActantState }> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      const [actant] = await db.insert(actants).values(actantData).returning();
      const [state] = await db
        .insert(actantStates)
        .values({
          actant_id: actant.id,
          story_id: "default",
        })
        .returning();

      return { actant, state };
    } catch (error) {
      console.error("创建角色失败:", error);
      throw error;
    }
  }
);

/**
 * 更新角色
 */
ipcMain.handle(
  "actant:update",
  async (_event, actantData: ActantInsert): Promise<Actant> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");
      if (!actantData.id) throw new Error("角色 ID 不能为空");

      const db = getCosmosDb(cosmosId);

      const [updatedActant] = await db
        .update(actants)
        .set(actantData)
        .where(eq(actants.id, actantData.id))
        .returning();

      return updatedActant;
    } catch (error) {
      console.error("更新角色失败:", error);
      throw error;
    }
  }
);

/**
 * 删除角色
 */
ipcMain.handle(
  "actant:delete",
  async (_event, actantId: string): Promise<{ success: boolean }> => {
    try {
      const cosmosId = cosmosManager.getCurrentCosmosId();
      if (!cosmosId) throw new Error("没有活动的项目");

      const db = getCosmosDb(cosmosId);
      await db.delete(actants).where(eq(actants.id, actantId)).run();

      return { success: true };
    } catch (error) {
      console.error("删除角色失败:", error);
      throw error;
    }
  }
);

console.log("Actant IPC handlers registered");
