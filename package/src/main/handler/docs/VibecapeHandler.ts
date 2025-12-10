/**
 * 工作区和文档 IPC Handler
 * 使用新的 Repository 和 Docs 服务
 */

import { ipcMain, shell, dialog, BrowserWindow } from "electron";
import { RepositoryService } from "@main/services/Repository";
import { DocsService } from "@main/services/Docs";
import { getDocsRoot, setDocsRoot } from "@main/services/UserData";
import type { JSONContent } from "@tiptap/core";

// ==================== 工作区管理 ====================

ipcMain.handle("vibecape:getRepository", () =>
  RepositoryService.getCurrentRepository()
);

ipcMain.handle("vibecape:getDocsRoot", () =>
  getDocsRoot()
);

ipcMain.handle("vibecape:setDocsRoot", (_event, path: string) => {
  setDocsRoot(path);
});

ipcMain.handle("vibecape:createRepository", (_event, name: string) =>
  RepositoryService.create(name)
);

ipcMain.handle("vibecape:openRepository", (_event, id: string) =>
  RepositoryService.open(id)
);

ipcMain.handle("vibecape:closeRepository", () =>
  RepositoryService.close()
);

ipcMain.handle("vibecape:deleteRepository", (_event, id: string) =>
  RepositoryService.delete(id)
);

ipcMain.handle("vibecape:listRepositorys", () =>
  RepositoryService.listRepositorys()
);

ipcMain.handle("vibecape:restoreLastRepository", () =>
  RepositoryService.restoreLastRepository()
);

ipcMain.handle("vibecape:getLlmTxt", (_event, id?: string) =>
  RepositoryService.getLlmTxt(id)
);

ipcMain.handle("vibecape:setLlmTxt", (_event, content: string, id?: string) =>
  RepositoryService.setLlmTxt(content, id)
);

ipcMain.handle("vibecape:updateRepositoryConfig", (_event, config: any) => {
  const repository = RepositoryService.getCurrentRepository();
  if (!repository) {
    throw new Error("No repository open");
  }
  return RepositoryService.updateConfig(repository.id, config);
});

// ==================== 文档树 ====================

ipcMain.handle("vibecape:getTree", () =>
  DocsService.getTree()
);

// ==================== 文档 CRUD ====================

ipcMain.handle("vibecape:getDoc", (_event, id: string) =>
  DocsService.getDoc(id)
);

ipcMain.handle(
  "vibecape:createDoc",
  (
    _event,
    payload: {
      parent_id?: string | null;
      title: string;
      content?: JSONContent;
      metadata?: Record<string, any>;
    }
  ) => DocsService.createDoc(payload)
);

ipcMain.handle(
  "vibecape:updateDoc",
  (
    _event,
    payload: {
      id: string;
      data: Partial<{
        title: string;
        content: JSONContent;
        metadata: Record<string, any>;
        parent_id: string | null;
        order: number;
      }>;
    }
  ) => DocsService.updateDoc(payload.id, payload.data)
);

ipcMain.handle("vibecape:deleteDoc", (_event, id: string) =>
  DocsService.deleteDoc(id)
);

ipcMain.handle("vibecape:getTrash", () =>
  DocsService.getTrash()
);

ipcMain.handle("vibecape:restoreDoc", (_event, id: string) =>
  DocsService.restoreDoc(id)
);

ipcMain.handle("vibecape:deletePermanently", (_event, id: string) =>
  DocsService.deletePermanently(id)
);

ipcMain.handle("vibecape:emptyTrash", () =>
  DocsService.emptyTrash()
);

ipcMain.handle(
  "vibecape:reorderDoc",
  (_event, activeId: string, overId: string) =>
    DocsService.reorderDoc(activeId, overId)
);

ipcMain.handle(
  "vibecape:moveDoc",
  (_event, docId: string, newParentId: string | null) =>
    DocsService.moveDoc(docId, newParentId)
);

// ==================== 导出 ====================

ipcMain.handle("vibecape:exportDocAsMarkdown", (_event, id: string) =>
  DocsService.exportDocAsMarkdown(id)
);

ipcMain.handle("vibecape:exportDocAsPdf", (_event, id: string) =>
  DocsService.exportDocAsPdf(id)
);

ipcMain.handle("vibecape:openInFinder", async () => {
  const repository = RepositoryService.getCurrentRepository();
  if (repository?.path) {
    await shell.openPath(repository.path);
  }
});

// ==================== 导入 ====================

ipcMain.handle("vibecape:importMarkdownFile", async () => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win!, {
    title: "导入 Markdown 文件",
    filters: [{ name: "Markdown", extensions: ["md", "mdx"] }],
    properties: ["openFile", "multiSelections"],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { count: 0 };
  }

  let count = 0;
  for (const filePath of result.filePaths) {
    await DocsService.importMarkdownFile(filePath);
    count++;
  }
  return { count };
});

ipcMain.handle("vibecape:importDirectory", async () => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win!, {
    title: "导入文档目录",
    properties: ["openDirectory"],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { count: 0 };
  }

  const count = await DocsService.importFumadocsDirectory(result.filePaths[0]);
  return { count };
});

ipcMain.handle("vibecape:importVibecapeDb", async () => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win!, {
    title: "导入 Vibecape 数据库",
    filters: [{ name: "SQLite Database", extensions: ["db"] }],
    properties: ["openFile"],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { count: 0 };
  }

  const count = await DocsService.importVibecapeDb(result.filePaths[0]);
  return { count };
});

// ==================== 对话框 ====================

ipcMain.handle("dialog:openDirectory", async () => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win!, {
    properties: ["openDirectory", "createDirectory"],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});
