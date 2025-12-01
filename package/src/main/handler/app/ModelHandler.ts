import { ipcMain } from "electron";
import { Model } from "../../services/Model";
import type { ModelInsert } from "@common/schema/app";

// ============ 模型管理 ============

ipcMain.handle("model:list", () => {
  return Model.list();
});

ipcMain.handle(
  "model:create",
  async (_event, payload: ModelInsert) => {
    return Model.create(payload);
  }
);

ipcMain.handle(
  "model:update",
  async (
    _event,
    payload: { id: string; changes: Partial<ModelInsert> }
  ) => {
    return Model.update(payload.id, payload.changes);
  }
);

ipcMain.handle("model:delete", async (_event, id: string) => {
  await Model.delete(id);
  return { success: true };
});
