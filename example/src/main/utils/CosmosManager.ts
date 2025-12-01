import { metasDb } from "../db/metas";
import { cosmos_metas } from "../../common/schema/cosmos_metas";
import { desc, eq } from "drizzle-orm";

/**
 * 项目管理器 - 单例模式
 * 管理当前打开的项目（内存中）和项目历史（数据库持久化）
 */
class CosmosManager {
  private static instance: CosmosManager;
  private currentCosmosId: string | null = null;

  private constructor() {
    // 私有构造函数，防止外部实例化
  }

  /**
   * 获取单例实例
   */
  static getInstance(): CosmosManager {
    if (!CosmosManager.instance) {
      CosmosManager.instance = new CosmosManager();
    }
    return CosmosManager.instance;
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    console.log("[CosmosManager] 初始化完成");
  }

  /**
   * 获取当前打开的项目 ID
   */
  getCurrentCosmosId(): string | null {
    return this.currentCosmosId;
  }

  /**
   * 设置当前打开的项目（只在内存中）
   */
  async setCurrentCosmos(cosmosId: string | null): Promise<void> {
    try {
      // 更新内存中的值
      this.currentCosmosId = cosmosId;

      // 如果打开了项目，更新历史记录
      if (cosmosId) {
        await this.updateCosmosHistory(cosmosId);
      }

      console.log("[CosmosManager] 当前项目已更新:", cosmosId);
    } catch (error) {
      console.error("[CosmosManager] 设置当前项目失败:", error);
      throw error;
    }
  }

  /**
   * 更新项目历史记录
   */
  private async updateCosmosHistory(cosmosId: string): Promise<void> {
    try {
      const now = Date.now();

      await metasDb
        .update(cosmos_metas)
        .set({
          last_opened_at: now,
        })
        .where(eq(cosmos_metas.id, cosmosId));

      console.log("[CosmosManager] 项目历史已更新:", cosmosId);
    } catch (error) {
      console.error("[CosmosManager] 更新项目历史失败:", error);
    }
  }

  /**
   * 获取项目历史列表（按最近打开时间排序）
   */
  async getCosmosHistory(): Promise<
    Array<{ id: string; last_opened_at: number }>
  > {
    try {
      const histories = await metasDb
        .select()
        .from(cosmos_metas)
        .orderBy(desc(cosmos_metas.last_opened_at))
        .all();

      return histories.map((h) => ({
        id: h.id,
        last_opened_at: h.last_opened_at || 0,
      }));
    } catch (error) {
      console.error("[CosmosManager] 获取项目历史失败:", error);
      return [];
    }
  }

  /**
   * 清除项目历史记录
   */
  async clearHistory(): Promise<void> {
    try {
      await metasDb.delete(cosmos_metas);
      console.log("[CosmosManager] 项目历史已清除");
    } catch (error) {
      console.error("[CosmosManager] 清除项目历史失败:", error);
      throw error;
    }
  }

  /**
   * 关闭当前项目
   */
  async closeCurrentCosmos(): Promise<void> {
    await this.setCurrentCosmos(null);
  }

  /**
   * 确保当前有打开的项目
   */
  requireCurrentCosmos(): string {
    if (!this.currentCosmosId) {
      throw new Error("没有打开的项目，请先打开一个项目");
    }
    return this.currentCosmosId;
  }
}

// 导出单例实例
export const cosmosManager = CosmosManager.getInstance();
