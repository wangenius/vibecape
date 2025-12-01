import { Model, ModelInsert, SettingsData } from "@common/schema";
import type { Shape } from "@common/lib/shape";

export interface SettingsAPI {
  /** 获取设置 */
  get: () => Promise<SettingsData>;
  /** 更新设置 */
  update: (path: Shape, value: unknown) => Promise<SettingsData>;
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
