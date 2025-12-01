/**
 * Cosmos Store - 世界观数据统一管理
 * 整合所有模块的 Slices
 */

import { API } from "@/lib/client";
import { create } from "zustand";

// 导入各模块的 Slice
import { createStorySlice, type StorySlice } from "./useStory";
import { createActantSlice, type ActantSlice } from "./useActant";
import { createLoreSlice, type LoreSlice } from "./useLore";
import {
  createActantStateSlice,
  type ActantStateSlice,
} from "./useActantState";
import { createLoreTypeSlice, type LoreTypeSlice } from "./useLoreType";
import { createActantTypeSlice, type ActantTypeSlice } from "./useActantType";
import { createRelationSlice, type RelationSlice } from "./useRelation";
import { CosmosMeta } from "@common/schema";
import { createCosmosMetaSlice, CosmosMetaSlice } from "./useCosmosMeta";

type CosmosStore = CosmosMetaSlice &
  StorySlice &
  ActantSlice &
  LoreSlice &
  ActantStateSlice &
  LoreTypeSlice &
  ActantTypeSlice &
  RelationSlice;

export const useCosmos = create<CosmosStore>()((set, get) => ({
  // 合并所有 Slices
  ...createCosmosMetaSlice(set),
  ...createStorySlice(set, get),
  ...createActantSlice(set, get),
  ...createLoreSlice(set, get),
  ...createActantStateSlice(set, get),
  ...createLoreTypeSlice(set, get),
  ...createActantTypeSlice(set, get),
  ...createRelationSlice(set, get),
}));

// ==================== Cosmos 操作函数 ====================

/** 从后端同步世界观列表 */
export async function syncCosmosList() {
  try {
    const list = await API.cosmos.meta.list();
    useCosmos.getState().setCosmosList(list);
  } catch (error) {
    console.error("同步世界观列表失败:", error);
    throw error;
  }
}

/**
 * 打开世界观
 * @param id 世界观 ID，不传则从后端获取当前打开的
 * @param skipTabOpen 是否跳过打开标签页（恢复时使用）
 */
export async function openCosmos(
  id?: string,
  skipTabOpen = false
): Promise<void> {
  try {
    // 从后端获取世界观元数据
    // - 传 id：获取指定的 cosmos（并设置为当前）
    // - 不传 id：获取后端当前打开的 cosmos
    const meta = await API.cosmos.meta.get(id);

    if (!meta) {
      // 如果没有传 id 且后端没有打开的 cosmos，直接返回
      if (!id) {
        return;
      }
      throw new Error("世界观不存在");
    }

    const currentCosmos = useCosmos.getState().current_meta;

    /* 如果是同一个世界观，直接返回 */
    if (currentCosmos?.id === meta.id) {
      return;
    }

    // 并行获取所有子资源
    const [
      stories,
      actants,
      actantStates,
      lores,
      loreTypes,
      actantTypes,
      relations,
    ] = await Promise.all([
      API.cosmos.story.list(),
      API.cosmos.actant.list(),
      API.cosmos.actantState.list(),
      API.cosmos.lore.list(),
      API.cosmos.loreType.list(),
      API.cosmos.actantType.list(),
      API.cosmos.relation.list(),
    ]);

    const state = useCosmos.getState();
    state.setCurrentCosmos(meta);
    state.setStories(stories);
    state.setActants(actants);
    state.setActantStates(actantStates);
    state.setLores(lores);
    state.setLoreTypes(loreTypes);
    state.setActantTypes(actantTypes);
    state.setRelations(relations);

    // 打开世界观详情标签（除非是恢复时）
    if (!skipTabOpen) {
      const { openCosmosDetailTab } = await import("@/hook/app/useViewManager");
      openCosmosDetailTab();
    }
  } catch (error) {
    console.error("打开世界观失败:", error);
    const { toast } = await import("sonner");
    toast.error("打开世界观失败", {
      description: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/** 关闭世界观 */
export async function closeCosmos(): Promise<void> {
  const currentCosmos = useCosmos.getState().current_meta;

  try {
    // 通知后端清空当前世界观状态，避免刷新后被重新恢复
    await API.cosmos.meta.close();

    // 注意：不再需要统一保存，各模块已经独立保存
    useCosmos.getState().setCurrentCosmos(null);

    // 关闭所有相关的 cosmos 标签页
    if (currentCosmos?.id) {
      try {
        const { getCurrentViewManager, closeTab } = await import(
          "@/hook/app/useViewManager"
        );
        const viewManager = getCurrentViewManager();

        // 找出所有属于当前 cosmos 的标签
        const cosmosTabsToClose = viewManager.tabs.filter(
          (tab) => tab.type === "cosmos" && tab.contentId === currentCosmos.id
        );

        // 关闭所有相关标签
        for (const tab of cosmosTabsToClose) {
          await closeTab(tab.id);
        }
      } catch (tabError) {
        console.error("关闭相关标签页失败:", tabError);
        // 不抛出错误，继续执行
      }
    }
  } catch (error) {
    console.error("关闭世界观失败:", error);
    throw error;
  }
}

/** 创建世界观 */
export async function createCosmos(data: {
  name: string;
  description?: any;
  tags?: any[];
}): Promise<CosmosMeta> {
  try {
    // 调用后端API创建元数据
    const meta = await API.cosmos.meta.create({
      name: data.name,
      description: data.description,
      tags: data.tags,
    });

    // 更新本地缓存
    const currentList = useCosmos.getState().meta_list;
    useCosmos.getState().setCosmosList({
      ...currentList,
      [meta.id]: meta,
    });

    // 设置为当前世界观
    useCosmos.getState().setCurrentCosmos(meta);

    // 打开详情标签
    const { openCosmosDetailTab } = await import("@/hook/app/useViewManager");
    openCosmosDetailTab();

    return meta;
  } catch (error) {
    console.error("创建世界观失败:", error);
    const { toast } = await import("sonner");
    toast.error("创建世界观失败", {
      description: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/** 删除世界观 */
export async function deleteCosmos(id: string): Promise<void> {
  try {
    const currentCosmos = useCosmos.getState().current_meta;

    // 如果是当前世界观，先关闭
    if (currentCosmos?.id === id) {
      await closeCosmos();
      // 关闭详情标签
      const { closeTab } = await import("@/hook/app/useViewManager");
      closeTab("cosmos:detail");
    }

    // 调用后端API删除
    await API.cosmos.meta.delete(id);

    // 更新本地缓存
    const currentList = useCosmos.getState().meta_list;
    const newList = { ...currentList };
    delete newList[id];
    useCosmos.getState().setCosmosList(newList);

    const { toast } = await import("sonner");
    toast.success("删除世界观成功");
  } catch (error) {
    console.error("删除世界观失败:", error);
    const { toast } = await import("sonner");
    toast.error("删除世界观失败", {
      description: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/** 导出世界观 */
export async function exportCosmos(id: string): Promise<void> {
  try {
    const path = await window.api.cosmos.meta.getPath(id);
    if (path) {
      await window.api.cosmos.meta.showInFolder(path);
      const { toast } = await import("sonner");
      toast.success("已在文件管理器中打开");
    }
  } catch (error) {
    console.error("导出世界观失败:", error);
    const { toast } = await import("sonner");
    toast.error("导出世界观失败", {
      description: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/** 初始化 Cosmos Store - 从后端恢复当前打开的世界观 */
async function initCosmos() {
  try {
    console.log("[useCosmos] 开始初始化...");

    // 加载世界观列表
    await syncCosmosList();

    // 尝试恢复后端打开的 cosmos（不传 id，后端会返回当前打开的）
    await openCosmos(undefined, true);

    console.log("[useCosmos] 初始化完成");
  } catch (error) {
    console.error("[useCosmos] 初始化失败:", error);
  }
}

// 初始化：加载世界观列表和恢复后端打开的世界观
// 模块系统保证只执行一次
initCosmos();
