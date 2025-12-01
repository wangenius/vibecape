// ==================== 类型定义 ====================

import { API } from "@/lib/client";
import { CosmosMeta, CosmosMetaInsert } from "@common/schema";

export interface CosmosMetaSlice {
  // 项目数据
  current_meta: CosmosMeta | null;
  meta_list: Record<string, CosmosMeta>;
  setCurrentCosmos: (cosmos: CosmosMeta | null) => void;
  setCosmosList: (list: Record<string, CosmosMeta>) => void;
  updateCosmosMeta: (cosmosData: CosmosMetaInsert) => void;
}

// ==================== Slice Creators ====================

export const createCosmosMetaSlice = (set: any): CosmosMetaSlice => ({
  current_meta: null,
  meta_list: {},
  setCurrentCosmos: (cosmos) => set(() => ({ current_meta: cosmos })),

  setCosmosList: (list) => {
    console.log("setCosmosList called with:", list);
    set(() => ({ meta_list: list }));
  },

  updateCosmosMeta: async (metaData: CosmosMetaInsert) => {
    const meta = await API.cosmos.meta.update(metaData);
    set((state: CosmosMetaSlice) => ({
      current_meta: meta,
      meta_list: {
        ...state.meta_list,
        [meta.id]: meta,
      },
    }));
  },
});
