import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { ModelInsert, ProviderInsert } from "@common/schema";
import type { Shape } from "@common/lib/shape";

const api = {
  docs: {
    getRoot: () => ipcRenderer.invoke("docs:getRoot"),
    setRoot: (path: string) => ipcRenderer.invoke("docs:setRoot", path),
    chooseRoot: () => ipcRenderer.invoke("docs:chooseRoot"),
    listStories: () => ipcRenderer.invoke("docs:listStories"),
    getStory: (storyId: string) => ipcRenderer.invoke("docs:getStory", storyId),
    readDoc: (storyId: string, filePath: string) =>
      ipcRenderer.invoke("docs:readDoc", { storyId, path: filePath }),
    writeDoc: (
      storyId: string,
      filePath: string,
      content: string,
      metadata?: Record<string, any>
    ) =>
      ipcRenderer.invoke("docs:writeDoc", {
        storyId,
        path: filePath,
        content,
        metadata,
      }),
    saveMeta: (
      storyId: string,
      tree: any,
      rawMeta: Record<string, any>
    ) => ipcRenderer.invoke("docs:saveMeta", { storyId, tree, rawMeta }),
    deleteDoc: (storyId: string, docPath: string) =>
      ipcRenderer.invoke("docs:deleteDoc", { storyId, docPath }),
    reorderDoc: (storyId: string, activeId: string, overId: string) =>
      ipcRenderer.invoke("docs:reorderDoc", { storyId, activeId, overId }),
    moveDoc: (storyId: string, sourceId: string, targetFolderId: string) =>
      ipcRenderer.invoke("docs:moveDoc", { storyId, sourceId, targetFolderId }),
    ai: {
      generate: (payload: { id: string; prompt: string; messages?: any[] }) =>
        ipcRenderer.invoke("docs:ai:generate", payload),
      cancel: (id: string) => ipcRenderer.invoke("docs:ai:cancel", id),
    },
  },
  app: {
    provider: {
      list: () => ipcRenderer.invoke("provider:list"),
      get: (id: string) => ipcRenderer.invoke("provider:get", id),
      create: (payload: ProviderInsert) =>
        ipcRenderer.invoke("provider:create", payload),
      update: (id: string, changes: Partial<ProviderInsert>) =>
        ipcRenderer.invoke("provider:update", { id, changes }),
      delete: (id: string) => ipcRenderer.invoke("provider:delete", id),
      fetchModels: (providerId: string) =>
        ipcRenderer.invoke("provider:fetchModels", providerId),
    },
    model: {
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
  },
  chat: {
    get: (threadId: string) => ipcRenderer.invoke("chat:get", threadId),
    list: (payload?: { limit?: number; offset?: number }) =>
      ipcRenderer.invoke("chat:list", payload),
    create: () => ipcRenderer.invoke("chat:create"),
    delete: (threadId: string) => ipcRenderer.invoke("chat:delete", threadId),
    stream: (payload: any) => ipcRenderer.invoke("chat:stream", payload),
    cancel: (id: string) => ipcRenderer.invoke("chat:cancel", id),
    agents: () => ipcRenderer.invoke("chat:agents"),
    onThreadUpdated: (
      callback: (data: { threadId: string; title: string }) => void
    ) => {
      const handler = (_event: any, data: { threadId: string; title: string }) =>
        callback(data);
      ipcRenderer.on("chat:thread-updated", handler);
      return () => ipcRenderer.removeListener("chat:thread-updated", handler);
    },
  },
  vibecape: {
    // 工作区管理
    getWorkspace: () => ipcRenderer.invoke("vibecape:getWorkspace"),
    createWorkspace: () => ipcRenderer.invoke("vibecape:createWorkspace"),
    openWorkspace: () => ipcRenderer.invoke("vibecape:openWorkspace"),
    pickDocsFolder: () => ipcRenderer.invoke("vibecape:pickDocsFolder"),
    initWorkspace: (docsDir: string) =>
      ipcRenderer.invoke("vibecape:initWorkspace", docsDir),
    // 文档树
    getTree: () => ipcRenderer.invoke("vibecape:getTree"),
    // 文档 CRUD
    getDoc: (id: string) => ipcRenderer.invoke("vibecape:getDoc", id),
    createDoc: (data: any) => ipcRenderer.invoke("vibecape:createDoc", data),
    updateDoc: (id: string, data: any) =>
      ipcRenderer.invoke("vibecape:updateDoc", { id, data }),
    deleteDoc: (id: string) => ipcRenderer.invoke("vibecape:deleteDoc", id),
    reorderDoc: (activeId: string, overId: string) =>
      ipcRenderer.invoke("vibecape:reorderDoc", activeId, overId),
    moveDoc: (docId: string, newParentId: string | null) =>
      ipcRenderer.invoke("vibecape:moveDoc", docId, newParentId),
    // 同步
    importFromDocs: () => ipcRenderer.invoke("vibecape:importFromDocs"),
    exportToDocs: () => ipcRenderer.invoke("vibecape:exportToDocs"),
    // 导出单个文档
    exportDocAsMarkdown: (id: string) =>
      ipcRenderer.invoke("vibecape:exportDocAsMarkdown", id),
    exportDocAsPdf: (id: string) =>
      ipcRenderer.invoke("vibecape:exportDocAsPdf", id),
    // 在 Finder 中打开工作区
    openInFinder: () => ipcRenderer.invoke("vibecape:openInFinder"),
    // 图片
    resolveAssetPath: (assetPath: string) =>
      ipcRenderer.invoke("vibecape:resolveAssetPath", assetPath),
    uploadImage: (payload: { filename: string; data: string; useOss?: boolean }) =>
      ipcRenderer.invoke("vibecape:uploadImage", payload),
  },
};

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
