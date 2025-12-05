import { create } from "zustand";
import type {
  Provider as ProviderRecord,
  ProviderInsert,
} from "@common/schema/app";

type ProviderMap = Record<string, ProviderRecord>;

export interface RemoteModel {
  id: string;
  object?: string;
}

// ==================== Zustand Store ====================

interface ProvidersStore {
  providers: ProviderMap;
  setProviders: (providers: ProviderMap) => void;
  upsertProvider: (provider: ProviderRecord) => void;
  removeProvider: (id: string) => void;
}

const useProvidersStore = create<ProvidersStore>((set) => ({
  providers: {},
  setProviders: (providers) => set({ providers }),
  upsertProvider: (provider) =>
    set((state) => ({
      providers: {
        ...state.providers,
        [provider.id]: provider,
      },
    })),
  removeProvider: (id) =>
    set((state) => {
      const next = { ...state.providers };
      delete next[id];
      return { providers: next };
    }),
}));

// ==================== Hooks ====================

export function useProviders<T = ProviderMap>(
  selector?: (state: ProvidersStore) => T
): T {
  return useProvidersStore(selector ?? ((state) => state.providers as T));
}

export function useProviderList() {
  const providers = useProvidersStore((state) => state.providers);
  // 使用 useMemo 避免每次渲染创建新数组
  return Object.values(providers);
}

export function useProvider(id: string) {
  return useProvidersStore((state) => state.providers[id]);
}

// ==================== 工具函数 ====================

export function getProviderList(): ProviderMap {
  return useProvidersStore.getState().providers;
}

export function getProvider(id: string): ProviderRecord | undefined {
  return useProvidersStore.getState().providers[id];
}

// ==================== 操作函数 ====================

export async function refreshProviders() {
  try {
    const list = await window.api.app.provider.list();
    const records = list.reduce<ProviderMap>((acc, provider) => {
      acc[provider.id] = provider;
      return acc;
    }, {});
    useProvidersStore.getState().setProviders(records);
    return records;
  } catch (error) {
    console.error("Failed to fetch providers:", error);
    return getProviderList();
  }
}

export async function createProvider(payload: ProviderInsert) {
  const record = await window.api.app.provider.create(payload);
  if (record) {
    useProvidersStore.getState().upsertProvider(record);
  }
  return record;
}

export async function updateProvider(
  id: string,
  changes: Partial<ProviderInsert>
) {
  const record = await window.api.app.provider.update(id, changes);
  if (record) {
    useProvidersStore.getState().upsertProvider(record);
  } else {
    await refreshProviders();
  }
  return record;
}

export async function deleteProvider(id: string) {
  await window.api.app.provider.delete(id);
  useProvidersStore.getState().removeProvider(id);
}

export async function fetchRemoteModels(
  providerId: string
): Promise<RemoteModel[]> {
  return window.api.app.provider.fetchModels(providerId);
}

export async function initProviders() {
  try {
    await refreshProviders();
  } catch (error) {
    console.error("Failed to initialize providers:", error);
  }
}

// ==================== 向后兼容的类包装器 ====================

export class Providers {
  static get store() {
    return getProviderList();
  }

  static use<T = ProviderMap>(selector?: (state: ProvidersStore) => T): T {
    return useProviders(selector);
  }

  static async refresh() {
    return refreshProviders();
  }

  static async create(payload: ProviderInsert) {
    return createProvider(payload);
  }

  static async update(id: string, changes: Partial<ProviderInsert>) {
    return updateProvider(id, changes);
  }

  static async delete(id: string) {
    await deleteProvider(id);
  }

  static async fetchModels(providerId: string) {
    return fetchRemoteModels(providerId);
  }

  static async init() {
    await initProviders();
  }
}
