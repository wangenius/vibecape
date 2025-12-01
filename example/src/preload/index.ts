import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { ModelInsert } from "@common/schema";
import type { Shape } from "@common/lib/shape";

// Custom APIs for renderer
const api = {
  // 项目相关 API
  cosmos: {
    meta: {
      list: () => ipcRenderer.invoke("cosmos:meta:list"),
      get: (cosmosId: string) =>
        ipcRenderer.invoke("cosmos:meta:get", cosmosId),
      create: (cosmosData: any) =>
        ipcRenderer.invoke("cosmos:meta:create", cosmosData),
      update: (cosmosData: any) =>
        ipcRenderer.invoke("cosmos:meta:update", cosmosData),
      close: () => ipcRenderer.invoke("cosmos:meta:close"),
      delete: (cosmosId: string) =>
        ipcRenderer.invoke("cosmos:meta:delete", cosmosId),
      getPath: (cosmosId: string) =>
        ipcRenderer.invoke("cosmos:meta:getPath", cosmosId),
      showInFolder: (cosmosPath: string) =>
        ipcRenderer.invoke("cosmos:meta:showInFolder", cosmosPath),
    },
    story: {
      list: () => ipcRenderer.invoke("story:list"),
      get: (storyId: string) => ipcRenderer.invoke("story:get", storyId),
      create: (storyData: any) => ipcRenderer.invoke("story:create", storyData),
      update: (storyData: any) => ipcRenderer.invoke("story:update", storyData),
      delete: (storyId: string) => ipcRenderer.invoke("story:delete", storyId),
    },
    actant: {
      list: () => ipcRenderer.invoke("actant:list"),
      get: (actantId: string) => ipcRenderer.invoke("actant:get", actantId),
      create: (actantData: any) =>
        ipcRenderer.invoke("actant:create", actantData),
      update: (actantData: any) =>
        ipcRenderer.invoke("actant:update", actantData),
      delete: (actantId: string) =>
        ipcRenderer.invoke("actant:delete", actantId),
    },
    actantState: {
      list: () => ipcRenderer.invoke("actantState:list"),
      get: (stateId: string) => ipcRenderer.invoke("actantState:get", stateId),
      create: (stateData: any) =>
        ipcRenderer.invoke("actantState:create", stateData),
      update: (stateData: any) =>
        ipcRenderer.invoke("actantState:update", stateData),
      delete: (id: string) => ipcRenderer.invoke("actantState:delete", id),
    },
    lore: {
      list: () => ipcRenderer.invoke("lore:list"),
      get: (loreId: string) => ipcRenderer.invoke("lore:get", loreId),
      create: (loreData: any) => ipcRenderer.invoke("lore:create", loreData),
      update: (loreData: any) => ipcRenderer.invoke("lore:update", loreData),
      delete: (loreId: string) => ipcRenderer.invoke("lore:delete", loreId),
    },
    loreType: {
      list: () => ipcRenderer.invoke("loreType:list"),
      get: (typeId: string) => ipcRenderer.invoke("loreType:get", typeId),
      create: (typeData: any) =>
        ipcRenderer.invoke("loreType:create", typeData),
      update: (typeData: any) =>
        ipcRenderer.invoke("loreType:update", typeData),
      delete: (typeId: string) => ipcRenderer.invoke("loreType:delete", typeId),
    },
    actantType: {
      list: () => ipcRenderer.invoke("actantType:list"),
      get: (typeId: string) => ipcRenderer.invoke("actantType:get", typeId),
      create: (typeData: any) =>
        ipcRenderer.invoke("actantType:create", typeData),
      update: (typeData: any) =>
        ipcRenderer.invoke("actantType:update", typeData),
      delete: (typeId: string) =>
        ipcRenderer.invoke("actantType:delete", typeId),
    },
    relation: {
      list: () => ipcRenderer.invoke("relation:list"),
      get: (relationId: string) =>
        ipcRenderer.invoke("relation:get", relationId),
      create: (payload: any) => ipcRenderer.invoke("relation:create", payload),
      update: (payload: any) => ipcRenderer.invoke("relation:update", payload),
      delete: (id: string) => ipcRenderer.invoke("relation:delete", id),
    },
    stats: {
      get: (days?: number) => ipcRenderer.invoke("com.wangenius.stats:get-daily", days),
    },
  },
  // Novel 相关 API
  novel: {
    meta: {
      list: () => ipcRenderer.invoke("novel:list"),
      get: (novelId: string) => ipcRenderer.invoke("novel:get", novelId),
      create: (novelData: any) => ipcRenderer.invoke("novel:create", novelData),
      update: (novelData: any) => ipcRenderer.invoke("novel:update", novelData),
      delete: (novelId: string) => ipcRenderer.invoke("novel:delete", novelId),
    },
    chapter: {
      list: (novelId: string) => ipcRenderer.invoke("chapter:list", novelId),
      get: (chapterId: string) => ipcRenderer.invoke("chapter:get", chapterId),
      create: (novelId: string, chapterData: any) =>
        ipcRenderer.invoke("chapter:create", novelId, chapterData),
      update: (chapterData: any) =>
        ipcRenderer.invoke("chapter:update", chapterData),
      delete: (chapterId: string) =>
        ipcRenderer.invoke("chapter:delete", chapterId),
      reorder: (novelId: string, chapterIds: string[]) =>
        ipcRenderer.invoke("chapter:reorder", novelId, chapterIds),
    },
    ai: {
      generate: (payload: { id: string; prompt: string; messages?: any[] }) =>
        ipcRenderer.invoke("novel:ai:generate", payload),
      cancel: (id: string) => ipcRenderer.invoke("novel:ai:cancel", id),
    },
  },
  // App 相关 API（设置、模型、风格等）
  app: {
    model: {
      // 模型管理
      list: () => ipcRenderer.invoke("model:list"),
      create: (payload: ModelInsert) =>
        ipcRenderer.invoke("model:create", payload),
      update: (id: string, changes: Partial<ModelInsert>) =>
        ipcRenderer.invoke("model:update", { id, changes }),
      delete: (id: string) => ipcRenderer.invoke("model:delete", id),
    },
    settings: {
      get: () => ipcRenderer.invoke("settings:get"),
      update: (path: Shape, value: unknown) =>
        ipcRenderer.invoke("settings:update", path, value),
    },
    writingStyle: {
      getAll: () => ipcRenderer.invoke("writingStyle:getAll"),
      create: (payload: any) =>
        ipcRenderer.invoke("writingStyle:create", payload),
      update: (id: string, changes: any) =>
        ipcRenderer.invoke("writingStyle:update", { id, changes }),
      delete: (id: string) => ipcRenderer.invoke("writingStyle:delete", id),
    },
  },
  chat: {
    get: (threadId: string) => ipcRenderer.invoke("chat:get", threadId),
    list: (payload?: { limit?: number; offset?: number }) =>
      ipcRenderer.invoke("chat:list", payload),
    create: () => ipcRenderer.invoke("chat:create"),
    delete: (threadId: string) =>
      ipcRenderer.invoke("chat:delete", threadId),
    stream: (payload: any) => ipcRenderer.invoke("chat:stream", payload),
    cancel: (id: string) => ipcRenderer.invoke("chat:cancel", id),
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
