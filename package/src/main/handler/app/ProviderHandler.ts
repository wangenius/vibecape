import { ipcMain } from "electron";
import { Provider } from "../../services/Provider";
import type { ProviderInsert } from "@common/schema/app";

// ============ Provider 管理 ============

ipcMain.handle("provider:list", () => {
  return Provider.list();
});

ipcMain.handle("provider:get", (_event, id: string) => {
  return Provider.get(id);
});

ipcMain.handle("provider:create", async (_event, payload: ProviderInsert) => {
  return Provider.create(payload);
});

ipcMain.handle(
  "provider:update",
  async (
    _event,
    payload: { id: string; changes: Partial<ProviderInsert> }
  ) => {
    return Provider.update(payload.id, payload.changes);
  }
);

ipcMain.handle("provider:delete", async (_event, id: string) => {
  await Provider.delete(id);
  return { success: true };
});

ipcMain.handle("provider:fetchModels", async (_event, providerId: string) => {
  return Provider.fetchRemoteModels(providerId);
});
