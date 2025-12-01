import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { ModelInsert } from "@common/schema";
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
  },
  app: {
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
    // 同步
    importFromDocs: () => ipcRenderer.invoke("vibecape:importFromDocs"),
    exportToDocs: () => ipcRenderer.invoke("vibecape:exportToDocs"),
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
