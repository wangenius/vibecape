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
