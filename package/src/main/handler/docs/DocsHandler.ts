import { ipcMain } from "electron";
import { DocsService } from "@main/services/Docs";
import { DocNavNode } from "@common/types/docs";

ipcMain.handle("docs:getRoot", () => DocsService.getRoot());

ipcMain.handle("docs:setRoot", async (_event, rootPath: string) => {
  return DocsService.setRoot(rootPath);
});

ipcMain.handle("docs:chooseRoot", () => DocsService.chooseRoot());

ipcMain.handle("docs:listStories", () => DocsService.listStories());

ipcMain.handle("docs:getStory", (_event, storyId: string) =>
  DocsService.getStory(storyId)
);

ipcMain.handle(
  "docs:readDoc",
  (_event, payload: { storyId: string; path: string }) =>
    DocsService.readDoc(payload.storyId, payload.path)
);

ipcMain.handle(
  "docs:writeDoc",
  (
    _event,
    payload: {
      storyId: string;
      path: string;
      content: string;
      metadata?: Record<string, any>;
    }
  ) => DocsService.writeDoc(payload.storyId, payload.path, payload.content, payload.metadata)
);

ipcMain.handle(
  "docs:saveMeta",
  (
    _event,
    payload: {
      storyId: string;
      tree: DocNavNode[];
      rawMeta: Record<string, any>;
    }
  ) => DocsService.saveMeta(payload)
);
