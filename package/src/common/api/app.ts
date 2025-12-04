import { Model, ModelInsert, Provider, ProviderInsert } from "@common/schema";
import type { AppConfig } from "@common/schema/config";
import type { Shape } from "@common/lib/shape";

export interface SettingsAPI {
  /** 获取设置 */
  get: () => Promise<AppConfig>;
  /** 更新设置 */
  update: (path: Shape, value: unknown) => Promise<AppConfig>;
}

/** Provider 远程模型 */
export interface RemoteModel {
  id: string;
  object?: string;
}

/** Provider 管理 */
export interface ProviderAPI {
  /** 获取 Provider 列表 */
  list: () => Promise<Provider[]>;
  /** 获取单个 Provider */
  get: (id: string) => Promise<Provider | null>;
  /** 创建 Provider */
  create: (payload: ProviderInsert) => Promise<Provider>;
  /** 更新 Provider */
  update: (id: string, changes: Partial<ProviderInsert>) => Promise<Provider>;
  /** 删除 Provider */
  delete: (id: string) => Promise<{ success: boolean }>;
  /** 获取 Provider 远程模型列表 */
  fetchModels: (providerId: string) => Promise<RemoteModel[]>;
}

/** 模型管理 */
export interface ModelAPI {
  /** 获取模型列表 */
  list: () => Promise<Model[]>;
  /** 创建模型 */
  create: (payload: ModelInsert) => Promise<Model>;
  /** 更新模型 */
  update: (id: string, changes: Partial<ModelInsert>) => Promise<Model>;
  /** 删除模型 */
  delete: (id: string) => Promise<{ success: boolean }>;
}
