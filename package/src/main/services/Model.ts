import type { LanguageModel } from "ai";
import { eq } from "drizzle-orm";
import {
  models,
  type Model as ModelRecord,
  type ModelInsert,
  type SettingsData,
} from "@common/schema/app";
import { appDb } from "../db/app";
import { getModelInstance } from "../utils/providers";
import { SettingsService } from "./Settings";

type ModelCategoryKey = keyof SettingsData["model"];

/**
 * Model Service
 *
 * 职责：
 * 1. 模型配置管理（CRUD + 内存缓存）
 * 2. 默认模型配置管理（从 Settings 表中读取）
 * 3. AI 模型实例管理（LanguageModel 实例缓存）
 */
export class Model {
  private static models = new Map<string, ModelRecord>();
  private static instances = new Map<string, LanguageModel>();

  private static initPromise: Promise<void> | null = null;
  private static initialized = false;

  /**
   * 初始化服务：从数据库加载所有模型配置与设置
   */
  static async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.loadAll()
        .catch((error) => {
          console.error("[Model] 初始化失败:", error);
        })
        .finally(() => {
          this.initPromise = null;
        });
    }
    await this.initPromise;
  }

  private static async loadAll(): Promise<void> {
    const allModels = await appDb.select().from(models);
    this.models = new Map(allModels.map((model) => [model.id, model]));

    this.initialized = true;
    console.log(`[Model] 已加载 ${this.models.size} 个模型配置`);
  }

  private static async ensureInit(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * 手动刷新缓存（重新从数据库加载）
   */
  static async refresh(): Promise<void> {
    await this.loadAll();
  }

  /**
   * 获取所有模型配置
   */
  static list(): ModelRecord[] {
    return Array.from(this.models.values());
  }

  /**
   * 根据 ID 获取模型配置
   */
  static getRecord(id: string): ModelRecord | null {
    return this.models.get(id) ?? null;
  }

  /**
   * 创建新的模型配置
   */
  static async create(payload: ModelInsert): Promise<ModelRecord> {
    await this.ensureInit();

    if (!payload.provider_id?.trim()) {
      throw new Error("Provider 不能为空");
    }

    const [record] = await appDb.insert(models).values(payload).returning();
    this.models.set(record.id, record);
    return record;
  }

  /**
   * 更新模型配置
   */
  static async update(
    id: string,
    changes: Partial<ModelInsert>
  ): Promise<ModelRecord> {
    await this.ensureInit();

    const updateData: Partial<ModelInsert> = {};

    if (changes.name !== undefined) updateData.name = changes.name;
    if (changes.description !== undefined)
      updateData.description = changes.description;
    if (changes.model !== undefined) updateData.model = changes.model;
    if (changes.provider_id !== undefined)
      updateData.provider_id = changes.provider_id;
    if (changes.type !== undefined) updateData.type = changes.type;
    if (changes.json !== undefined) updateData.json = changes.json;
    if (changes.reasoner !== undefined) updateData.reasoner = changes.reasoner;

    const [record] = await appDb
      .update(models)
      .set(updateData)
      .where(eq(models.id, id))
      .returning();

    if (!record) {
      throw new Error(`模型 ${id} 不存在`);
    }

    this.models.set(record.id, record);
    this.instances.delete(id);

    return record;
  }

  /**
   * 删除模型配置
   */
  static async delete(id: string): Promise<void> {
    await this.ensureInit();
    await appDb.delete(models).where(eq(models.id, id));
    this.models.delete(id);
    this.instances.delete(id);
  }

  /**
   * 根据模型 ID 获取模型实例（带缓存）
   */
  static async getById(id: string): Promise<LanguageModel> {
    await this.ensureInit();

    if (this.instances.has(id)) {
      return this.instances.get(id)!;
    }

    const config = this.getRecord(id);
    if (!config) {
      throw new Error(`模型 ${id} 不存在，请先在设置中添加模型`);
    }

    const instance = await getModelInstance(config);
    this.instances.set(id, instance);
    return instance;
  }

  /**
   * 根据类别获取默认模型实例
   */
  static async get(
    category: ModelCategoryKey = "primary"
  ): Promise<LanguageModel> {
    await this.ensureInit();

    const settings = await SettingsService.get();
    const modelId = settings.model[category];
    if (!modelId) {
      throw new Error(`未找到类别 ${category} 的默认模型，请先在设置中配置`);
    }

    return this.getById(modelId);
  }
}

// 延迟初始化 - 等待数据库就绪后由 main/index.ts 触发
