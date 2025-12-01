import { eq } from "drizzle-orm";
import {
  providers,
  type Provider as ProviderRecord,
  type ProviderInsert,
} from "@common/schema/app";
import { appDb } from "../db/app";

/**
 * 远程模型信息
 */
export interface RemoteModel {
  id: string;
  object?: string;
}

/**
 * Provider Service
 *
 * 职责：
 * 1. Provider 配置管理（CRUD + 内存缓存）
 * 2. 从 Provider 获取远程模型列表
 */
export class Provider {
  private static providers = new Map<string, ProviderRecord>();
  private static initPromise: Promise<void> | null = null;
  private static initialized = false;

  /**
   * 初始化服务：从数据库加载所有 Provider 配置
   */
  static async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.loadAll()
        .catch((error) => {
          console.error("[Provider] 初始化失败:", error);
        })
        .finally(() => {
          this.initPromise = null;
        });
    }
    await this.initPromise;
  }

  private static async loadAll(): Promise<void> {
    const allProviders = await appDb.select().from(providers);
    this.providers = new Map(allProviders.map((p) => [p.id, p]));

    this.initialized = true;
    console.log(`[Provider] 已加载 ${this.providers.size} 个 Provider`);
  }

  private static async ensureInit(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * 手动刷新缓存
   */
  static async refresh(): Promise<void> {
    await this.loadAll();
  }

  /**
   * 获取所有 Provider
   */
  static list(): ProviderRecord[] {
    return Array.from(this.providers.values());
  }

  /**
   * 根据 ID 获取 Provider
   */
  static get(id: string): ProviderRecord | null {
    return this.providers.get(id) ?? null;
  }

  /**
   * 创建新的 Provider
   */
  static async create(payload: ProviderInsert): Promise<ProviderRecord> {
    await this.ensureInit();

    if (!payload.name?.trim()) {
      throw new Error("Provider 名称不能为空");
    }
    if (!payload.base_url?.trim()) {
      throw new Error("Base URL 不能为空");
    }
    if (!payload.api_key?.trim()) {
      throw new Error("API Key 不能为空");
    }

    const [record] = await appDb.insert(providers).values(payload).returning();
    this.providers.set(record.id, record);
    return record;
  }

  /**
   * 更新 Provider
   */
  static async update(
    id: string,
    changes: Partial<ProviderInsert>
  ): Promise<ProviderRecord> {
    await this.ensureInit();

    const updateData: Partial<ProviderInsert> = {};

    if (changes.name !== undefined) updateData.name = changes.name;
    if (changes.base_url !== undefined) updateData.base_url = changes.base_url;
    if (changes.api_key !== undefined) updateData.api_key = changes.api_key;
    if (changes.models_path !== undefined)
      updateData.models_path = changes.models_path;
    if (changes.enabled !== undefined) updateData.enabled = changes.enabled;

    const [record] = await appDb
      .update(providers)
      .set(updateData)
      .where(eq(providers.id, id))
      .returning();

    if (!record) {
      throw new Error(`Provider ${id} 不存在`);
    }

    this.providers.set(record.id, record);
    return record;
  }

  /**
   * 删除 Provider
   */
  static async delete(id: string): Promise<void> {
    await this.ensureInit();
    await appDb.delete(providers).where(eq(providers.id, id));
    this.providers.delete(id);
  }

  /**
   * 从 Provider 获取远程模型列表
   */
  static async fetchRemoteModels(providerId: string): Promise<RemoteModel[]> {
    await this.ensureInit();

    const provider = this.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} 不存在`);
    }

    const url = `${provider.base_url.replace(/\/$/, "")}${provider.models_path}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${provider.api_key}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`获取模型列表失败: ${response.status}`);
      }

      const data = await response.json();

      // 标准 OpenAI 格式: { data: [{ id, object }], object: "list" }
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((m: any) => ({
          id: m.id,
          object: m.object,
        }));
      }

      // 某些 API 直接返回数组
      if (Array.isArray(data)) {
        return data.map((m: any) => ({
          id: typeof m === "string" ? m : m.id,
          object: typeof m === "string" ? "model" : m.object,
        }));
      }

      return [];
    } catch (error) {
      console.error(`[Provider] 获取远程模型失败:`, error);
      throw error;
    }
  }
}

// 延迟初始化 - 等待数据库就绪后由 main/index.ts 触发
