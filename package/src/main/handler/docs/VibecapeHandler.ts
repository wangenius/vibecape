import { ipcMain } from "electron";
import { VibecapeDocsService } from "@main/services/VibecapeDocs";
import type { JSONContent } from "@tiptap/core";

// ==================== 工作区管理 ====================

ipcMain.handle("vibecape:getWorkspace", () =>
  VibecapeDocsService.getCurrentWorkspace()
);

ipcMain.handle("vibecape:createWorkspace", () =>
  VibecapeDocsService.createWorkspace()
);

ipcMain.handle("vibecape:openWorkspace", () =>
  VibecapeDocsService.openWorkspace()
);

ipcMain.handle("vibecape:pickDocsFolder", () =>
  VibecapeDocsService.pickDocsFolder()
);

ipcMain.handle("vibecape:initWorkspace", (_event, docsDir: string) =>
  VibecapeDocsService.initWorkspace(docsDir)
);

// ==================== 文档树 ====================

ipcMain.handle("vibecape:getTree", () =>
  VibecapeDocsService.getTree()
);

// ==================== 文档 CRUD ====================

ipcMain.handle("vibecape:getDoc", (_event, id: string) =>
  VibecapeDocsService.getDoc(id)
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
  ) => VibecapeDocsService.createDoc(payload)
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
  ) => VibecapeDocsService.updateDoc(payload.id, payload.data)
);

ipcMain.handle("vibecape:deleteDoc", (_event, id: string) =>
  VibecapeDocsService.deleteDoc(id)
);

ipcMain.handle(
  "vibecape:reorderDoc",
  (_event, activeId: string, overId: string) =>
    VibecapeDocsService.reorderDoc(activeId, overId)
);

ipcMain.handle(
  "vibecape:moveDoc",
  (_event, docId: string, newParentId: string | null) =>
    VibecapeDocsService.moveDoc(docId, newParentId)
);

// ==================== 同步 ====================

ipcMain.handle("vibecape:importFromDocs", () =>
  VibecapeDocsService.importFromDocs()
);

ipcMain.handle("vibecape:exportToDocs", () =>
  VibecapeDocsService.exportToDocs()
);
