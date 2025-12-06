import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { ModelInsert, ProviderInsert } from "@common/schema";
import type { Shape } from "@common/lib/shape";
import type { MCPConfig } from "@common/schema/config";

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
    saveMeta: (storyId: string, tree: any, rawMeta: Record<string, any>) =>
      ipcRenderer.invoke("docs:saveMeta", { storyId, tree, rawMeta }),
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
    mcp: {
      get: () => ipcRenderer.invoke("mcp:get"),
      set: (config: MCPConfig) => ipcRenderer.invoke("mcp:set", config),
      connect: (serverName: string) =>
        ipcRenderer.invoke("mcp:connect", serverName),
      disconnect: (serverName: string) =>
        ipcRenderer.invoke("mcp:disconnect", serverName),
      status: () => ipcRenderer.invoke("mcp:status"),
      tools: () => ipcRenderer.invoke("mcp:tools"),
      callTool: (toolName: string, args: Record<string, unknown>) =>
        ipcRenderer.invoke("mcp:callTool", toolName, args),
      reload: () => ipcRenderer.invoke("mcp:reload"),
      onStatusChanged: (callback: () => void) => {
        const handler = () => callback();
        ipcRenderer.on("mcp:status-changed", handler);
        return () => ipcRenderer.removeListener("mcp:status-changed", handler);
      },
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
    heroes: () => ipcRenderer.invoke("chat:heroes"),
    /** @deprecated 使用 heroes */
    agents: () => ipcRenderer.invoke("chat:agents"),
    onThreadUpdated: (
      callback: (data: { threadId: string; title: string }) => void
    ) => {
      const handler = (
        _event: any,
        data: { threadId: string; title: string }
      ) => callback(data);
      ipcRenderer.on("chat:thread-updated", handler);
      return () => ipcRenderer.removeListener("chat:thread-updated", handler);
    },
  },
  vibecape: {
    // 工作区管理
    getWorkspace: () => ipcRenderer.invoke("vibecape:getWorkspace"),
    getDocsRoot: () => ipcRenderer.invoke("vibecape:getDocsRoot"),
    setDocsRoot: (path: string) =>
      ipcRenderer.invoke("vibecape:setDocsRoot", path),
    createWorkspace: (name: string) =>
      ipcRenderer.invoke("vibecape:createWorkspace", name),
    openWorkspace: (id: string) =>
      ipcRenderer.invoke("vibecape:openWorkspace", id),
    closeWorkspace: () => ipcRenderer.invoke("vibecape:closeWorkspace"),
    deleteWorkspace: (id: string) =>
      ipcRenderer.invoke("vibecape:deleteWorkspace", id),
    listWorkspaces: () => ipcRenderer.invoke("vibecape:listWorkspaces"),
    restoreLastWorkspace: () =>
      ipcRenderer.invoke("vibecape:restoreLastWorkspace"),
    getLlmTxt: (id?: string) => ipcRenderer.invoke("vibecape:getLlmTxt", id),
    setLlmTxt: (content: string, id?: string) =>
      ipcRenderer.invoke("vibecape:setLlmTxt", content, id),
    updateWorkspaceConfig: (config: any) =>
      ipcRenderer.invoke("vibecape:updateWorkspaceConfig", config),
    // 兼容旧 API
    /** @deprecated 使用 listWorkspaces */
    getWorkspaceHistory: () => ipcRenderer.invoke("vibecape:listWorkspaces"),
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
    // 导出
    exportDocAsMarkdown: (id: string) =>
      ipcRenderer.invoke("vibecape:exportDocAsMarkdown", id),
    exportDocAsPdf: (id: string) =>
      ipcRenderer.invoke("vibecape:exportDocAsPdf", id),
    // 导入
    importMarkdownFile: () => ipcRenderer.invoke("vibecape:importMarkdownFile"),
    importDirectory: () => ipcRenderer.invoke("vibecape:importDirectory"),
    importVibecapeDb: () => ipcRenderer.invoke("vibecape:importVibecapeDb"),
    // 在 Finder 中打开工作区
    openInFinder: () => ipcRenderer.invoke("vibecape:openInFinder"),
    // 图片
    resolveAssetPath: (assetPath: string) =>
      ipcRenderer.invoke("vibecape:resolveAssetPath", assetPath),
    uploadImage: (payload: {
      filename: string;
      data: string;
      useOss?: boolean;
    }) => ipcRenderer.invoke("vibecape:uploadImage", payload),
    // 文档变更监听 - 用于 AI 工具操作后刷新前端
    onDocsChanged: (callback: (data: { tool: string }) => void) => {
      const handler = (_event: any, data: { tool: string }) => callback(data);
      ipcRenderer.on("docs:changed", handler);
      return () => ipcRenderer.removeListener("docs:changed", handler);
    },
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
