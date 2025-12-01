import { ipcMain, shell } from "electron";
import { cosmosManager } from "../../utils/CosmosManager";
import { closeCosmosDb, getCosmosDir } from "../../db/cosmos";
import {
  type CosmosMetaInsert,
  type CosmosMeta,
  cosmos_metas,
} from "@common/schema/cosmos_metas";
import { initCosmosDatabase } from "../../db/cosmos";
import fs from "fs";
import { metasDb } from "@main/db/metas";
import { eq } from "drizzle-orm";
import { gen } from "@common/lib/generator";

// ==================== Cosmos Meta API ====================

/**
 * 获取项目列表
 */
ipcMain.handle(
  "cosmos:meta:list",
  async (): Promise<Record<string, CosmosMeta>> => {
    try {
      const metas = await metasDb.select().from(cosmos_metas).all();
      return metas.reduce((acc, curr) => {
        acc[curr.id] = curr;
        return acc;
      }, {});
    } catch (error) {
      console.error("获取项目列表失败:", error);
      return {};
    }
  }
);

/**
 * 获取项目元数据
 * - 不传 cosmosId：返回当前打开的项目
 * - 传入 cosmosId：返回指定项目（并设置为当前）
 */
ipcMain.handle(
  "cosmos:meta:get",
  async (_event, cosmosId?: string): Promise<CosmosMeta | undefined> => {
    try {
      // 如果没有传 cosmosId，获取当前打开的
      const targetId = cosmosId || cosmosManager.getCurrentCosmosId();

      if (!targetId) {
        return undefined;
      }

      // 直接从 metas.db 读取
      const meta = await metasDb
        .select()
        .from(cosmos_metas)
        .where(eq(cosmos_metas.id, targetId))
        .limit(1)
        .get();

      if (!meta) {
        return undefined;
      }

      // 确保项目数据库 Schema 是最新的
      await initCosmosDatabase(targetId);

      // 更新最后打开时间
      await metasDb
        .update(cosmos_metas)
        .set({ last_opened_at: Date.now() })
        .where(eq(cosmos_metas.id, targetId));

      // 设置为当前项目
      await cosmosManager.setCurrentCosmos(targetId);

      return meta;
    } catch (error) {
      console.error("获取项目失败:", error);
      throw error;
    }
  }
);

/**
 * 创建项目
 */
ipcMain.handle(
  "cosmos:meta:create",
  async (_event, cosmosData: CosmosMetaInsert): Promise<CosmosMeta> => {
    try {
      const cosmosId = gen.id();

      // 创建项目目录
      const cosmosDir = getCosmosDir(cosmosId);
      fs.mkdirSync(cosmosDir, { recursive: true });

      // 初始化项目数据库（确保所有表都创建，但不包含 meta 表）
      await initCosmosDatabase(cosmosId);

      // 准备完整的数据（包含 id）
      const fullData: CosmosMetaInsert = {
        ...cosmosData,
        id: cosmosId,
      };

      // 插入到 metas.db（单一数据源）
      const [created] = await metasDb
        .insert(cosmos_metas)
        .values(fullData)
        .returning();

      // 设置为当前项目
      await cosmosManager.setCurrentCosmos(cosmosId);

      return created;
    } catch (error) {
      console.error("创建项目失败:", error);
      throw error;
    }
  }
);

/**
 * 更新项目元数据
 */
ipcMain.handle(
  "cosmos:meta:update",
  async (_event, cosmosData: CosmosMetaInsert): Promise<CosmosMeta> => {
    try {
      const cosmos_id = cosmosManager.getCurrentCosmosId();
      if (!cosmos_id) throw new Error("没有活动的项目");
      // 直接更新 metas.db（单一数据源）
      const [updated] = await metasDb
        .update(cosmos_metas)
        .set(cosmosData)
        .where(eq(cosmos_metas.id, cosmos_id))
        .returning();

      return updated;
    } catch (error) {
      console.error("更新项目元数据失败:", error);
      throw error;
    }
  }
);

/**
 * 关闭当前项目
 */
ipcMain.handle("cosmos:meta:close", async () => {
  try {
    const currentId = cosmosManager.getCurrentCosmosId();

    if (currentId) {
      closeCosmosDb(currentId);
    }

    await cosmosManager.closeCurrentCosmos();

    return { success: true as const };
  } catch (error) {
    console.error("关闭项目失败:", error);
    throw error;
  }
});

/**
 * 删除项目
 */
ipcMain.handle(
  "cosmos:meta:delete",
  async (_event, cosmosId: string): Promise<{ success: boolean }> => {
    try {
      // 如果是当前项目，先关闭
      const currentId = cosmosManager.getCurrentCosmosId();
      if (currentId === cosmosId) {
        await cosmosManager.closeCurrentCosmos();
      }

      // 删除项目文件夹
      const cosmosDir = getCosmosDir(cosmosId);
      if (fs.existsSync(cosmosDir)) {
        fs.rmSync(cosmosDir, { recursive: true, force: true });
      }

      // 从 metas.db 删除元数据
      await metasDb
        .delete(cosmos_metas)
        .where(eq(cosmos_metas.id, cosmosId))
        .run();

      return { success: true as const };
    } catch (error) {
      console.error("删除项目失败:", error);
      throw error;
    }
  }
);

/**
 * 获取项目路径
 */
ipcMain.handle(
  "cosmos:meta:getPath",
  async (_event, cosmosId: string): Promise<string> => {
    try {
      return getCosmosDir(cosmosId);
    } catch (error) {
      console.error("获取项目路径失败:", error);
      throw error;
    }
  }
);

/**
 * 在文件管理器中显示项目
 */
ipcMain.handle(
  "cosmos:meta:showInFolder",
  async (_event, cosmosPath: string) => {
    try {
      await shell.showItemInFolder(cosmosPath);
      return { success: true };
    } catch (error) {
      console.error("打开文件夹失败:", error);
      throw error;
    }
  }
);

console.log("Cosmos Meta IPC handlers registered");
