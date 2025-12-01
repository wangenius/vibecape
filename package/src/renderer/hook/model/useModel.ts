import { create } from "zustand";
import type {
  Model as ModelRecord,
  ModelInsert,
  SettingsData,
} from "@common/schema/app";
import { getShape } from "@common/lib/shape";
import { settingsShape } from "@common/config/settings";
import { API } from "@/lib/client";

type ModelMap = Record<string, ModelRecord>;
export type ModelCategoryKey = keyof SettingsData["model"];

interface ModelCategoryConfig {
  category: ModelCategoryKey;
  model_id: string;
  label: string;
  description: string;
  constraints?: string;
}

const MODEL_CATEGORY_TEMPLATES: Record<
  ModelCategoryKey,
  Omit<ModelCategoryConfig, "model_id">
> = {
  primary: {
    category: "primary",
    label: "主模型",
    description: "用于核心功能的主要模型",
    constraints: JSON.stringify({
      requireJson: true,
      requireTools: true,
    }),
  },
  fast: {
    category: "fast",
    label: "快速模型",
    description: "用于快速响应的轻量级模型",
    constraints: JSON.stringify({ noReasoner: true, preferSmall: true }),
  },
  image: {
    category: "image",
    label: "图片模型",
    description: "用于图片生成和处理",
    constraints: JSON.stringify({ type: "img" }),
  },
  video: {
    category: "video",
    label: "视频模型",
    description: "用于视频生成和处理",
    constraints: JSON.stringify({ type: "video" }),
  },
  voice: {
    category: "voice",
    label: "语音模型",
    description: "用于语音合成和识别",
    constraints: JSON.stringify({ type: "voice" }),
  },
};

const DEFAULT_MODEL_IDS: SettingsData["model"] = {
  primary: "",
  fast: "",
  image: "",
  video: "",
  voice: "",
};

function buildDefaultModelRecords(
  modelSettings?: Partial<SettingsData["model"]>
): Record<string, ModelCategoryConfig> {
  const merged: SettingsData["model"] = {
    ...DEFAULT_MODEL_IDS,
    ...(modelSettings ?? {}),
  };

  return Object.entries(MODEL_CATEGORY_TEMPLATES).reduce(
    (acc, [key, template]) => {
      const category = key as ModelCategoryKey;
      acc[category] = {
        ...template,
        category,
        model_id: merged[category] ?? "",
      };
      return acc;
    },
    {} as Record<string, ModelCategoryConfig>
  );
}

// ==================== Zustand Store ====================

interface ModelsStore {
  models: ModelMap;
  setModels: (models: ModelMap) => void;
  upsertModel: (model: ModelRecord) => void;
  removeModel: (id: string) => void;
}

const useModelsStore = create<ModelsStore>((set) => ({
  models: {},
  setModels: (models) => set({ models }),
  upsertModel: (model) =>
    set((state) => ({
      models: {
        ...state.models,
        [model.id]: model,
      },
    })),
  removeModel: (id) =>
    set((state) => {
      const next = { ...state.models };
      delete next[id];
      return { models: next };
    }),
}));

interface DefaultModelsStore {
  defaultModels: Record<string, ModelCategoryConfig>;
  loading: boolean;
  error: string | null;
  setDefaultModels: (models: Record<string, ModelCategoryConfig>) => void;
  upsertDefaultModel: (model: ModelCategoryConfig) => void;
  removeDefaultModel: (category: string) => void;
}

const useDefaultModelsStore = create<DefaultModelsStore>((set) => ({
  defaultModels: buildDefaultModelRecords(),
  loading: false,
  error: null,
  setDefaultModels: (defaultModels) => set({ defaultModels }),
  upsertDefaultModel: (model) =>
    set((state) => ({
      defaultModels: {
        ...state.defaultModels,
        [model.category]: model,
      },
    })),
  removeDefaultModel: (category) =>
    set((state) => {
      const { [category]: _removed, ...rest } = state.defaultModels;
      return { defaultModels: rest };
    }),
}));

// ==================== Hooks ====================

export function useModels<T = ModelMap>(
  selector?: (state: ModelsStore) => T
): T {
  return useModelsStore(selector ?? ((state) => state.models as T));
}

export function useModelList() {
  return useModelsStore((state) => state.models);
}

export function useModel(id: string) {
  return useModelsStore((state) => state.models[id]);
}

export function useDefaultModels<T = Record<string, ModelCategoryConfig>>(
  selector?: (state: DefaultModelsStore) => T
): T {
  return useDefaultModelsStore(
    selector ?? ((state) => state.defaultModels as T)
  );
}

export function useDefaultModelList() {
  return useDefaultModelsStore((state) => state.defaultModels);
}

export function useDefaultModel(category: string) {
  return useDefaultModelsStore((state) => state.defaultModels[category]);
}

// ==================== 工具函数 ====================

export function getModelList(): ModelMap {
  return useModelsStore.getState().models;
}

export function getModel(id: string): ModelRecord | undefined {
  return useModelsStore.getState().models[id];
}

// ==================== 操作函数 ====================

export async function refreshModels() {
  try {
    const list = await API.app.model.list();
    const records = list.reduce<ModelMap>((acc, model) => {
      acc[model.id] = model;
      return acc;
    }, {});
    useModelsStore.getState().setModels(records);
    return records;
  } catch (error) {
    console.error("Failed to fetch models:", error);
    return getModelList();
  }
}

export async function createModel(payload: ModelInsert) {
  const record = await API.app.model.create(payload);
  if (record) {
    useModelsStore.getState().upsertModel(record);
  }
  return record;
}

export async function updateModel(
  id: string,
  changes: Partial<ModelInsert>
) {
  const record = await API.app.model.update(id, changes);
  if (record) {
    useModelsStore.getState().upsertModel(record);
  } else {
    await refreshModels();
  }
  return record;
}

export async function deleteModel(id: string) {
  await API.app.model.delete(id);
  useModelsStore.getState().removeModel(id);
}

export async function initModels() {
  try {
    await refreshModels();
  } catch (error) {
    console.error("Failed to initialize models:", error);
  }
}

// ==================== 默认模型操作函数 ====================

export async function refreshDefaultModels() {
  try {
    useDefaultModelsStore.setState({ loading: true, error: null });
    const settings = await API.app.settings.get();
    const records = buildDefaultModelRecords(settings?.model);
    useDefaultModelsStore.setState({
      defaultModels: records,
      loading: false,
    });
    return records;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "获取默认模型列表失败";
    useDefaultModelsStore.setState({ error: message, loading: false });
    throw error;
  }
}

export async function getDefaultModelId(
  category: ModelCategoryKey
): Promise<string | null> {
  try {
    return (
      useDefaultModelsStore.getState().defaultModels[category]?.model_id ||
      null
    );
  } catch (error) {
    console.error(`获取类别 ${category} 的模型ID失败:`, error);
    return null;
  }
}

export async function updateDefaultModel(
  category: ModelCategoryKey,
  modelId: string
) {
  const result = await API.app.settings.update(
    getShape(settingsShape.model[category]),
    modelId
  );

  const records = buildDefaultModelRecords(result?.model);
  useDefaultModelsStore.getState().setDefaultModels(records);

  return records[category];
}

export async function initDefaultModels() {
  try {
    await refreshDefaultModels();
  } catch (error) {
    console.error("Failed to initialize default models:", error);
  }
}

// ==================== 向后兼容的类包装器 ====================

export class Models {
  static get store() {
    return getModelList();
  }

  static use<T = ModelMap>(selector?: (state: ModelsStore) => T): T {
    return useModels(selector);
  }

  static async refresh() {
    return refreshModels();
  }

  static async create(payload: ModelInsert) {
    return createModel(payload);
  }

  static async update(id: string, changes: Partial<ModelInsert>) {
    return updateModel(id, changes);
  }

  static async delete(id: string) {
    await deleteModel(id);
  }

  static async init() {
    await initModels();
  }
}

export class DefaultModels {
  static use<T = Record<string, ModelCategoryConfig>>(
    selector?: (state: DefaultModelsStore) => T
  ): T {
    return useDefaultModels(selector);
  }

  static async refresh() {
    return refreshDefaultModels();
  }

  static async update(category: ModelCategoryKey, modelId: string) {
    return updateDefaultModel(category, modelId);
  }

  static async init() {
    await initDefaultModels();
  }
}
