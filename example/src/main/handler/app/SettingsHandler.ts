import { ipcMain } from "electron";
import { eq } from "drizzle-orm";
import { appDb } from "../../db/app";
import {
  writingStyle,
  type WritingStyle,
  type WritingStyleInsert,
} from "@common/schema/app";
import { updateProxyConfigCache } from "../../utils/proxy";
import { SettingsService } from "../../services/Settings";
import { settingsShape } from "@common/config/settings";
import { getShape, type Shape } from "@common/lib/shape";

// ==================== Settings API ====================

ipcMain.handle("settings:get", async () => {
  try {
    return await SettingsService.get();
  } catch (error) {
    console.error("获取设置失败:", error);
    throw error;
  }
});

ipcMain.handle(
  "settings:update",
  async (_event, path: Shape, value: unknown) => {
    try {
      const next = await SettingsService.update(path, value);
      updateProxyConfigCache(next.general.proxy);
      return next;
    } catch (error) {
      console.error("更新设置失败:", error);
      throw error;
    }
  }
);

// ==================== Writing Style API ====================

ipcMain.handle("writingStyle:getAll", async () => {
  try {
    return await appDb.select().from(writingStyle);
  } catch (error) {
    console.error("获取小说写作风格失败:", error);
    return [];
  }
});

ipcMain.handle(
  "writingStyle:create",
  async (_event, payload: WritingStyleInsert) => {
    try {
      const now = Date.now();
      const [record] = await appDb
        .insert(writingStyle)
        .values({
          ...payload,
          example: payload.example ?? null,
          created_at: now,
          updated_at: now,
        })
        .returning();

      return record;
    } catch (error) {
      console.error("添加小说写作风格失败:", error);
      throw error;
    }
  }
);

ipcMain.handle(
  "writingStyle:update",
  async (
    _event,
    payload: { id: string; changes: Partial<WritingStyleInsert> }
  ) => {
    try {
      const now = Date.now();
      const changes: Partial<WritingStyle> = {
        updated_at: now,
      };

      if (payload.changes.name !== undefined) {
        changes.name = payload.changes.name;
      }
      if (payload.changes.description !== undefined) {
        changes.description = payload.changes.description;
      }
      if (payload.changes.example !== undefined) {
        changes.example = payload.changes.example ?? null;
      }

      await appDb
        .update(writingStyle)
        .set(changes)
        .where(eq(writingStyle.id, payload.id));

      const records = await appDb
        .select()
        .from(writingStyle)
        .where(eq(writingStyle.id, payload.id))
        .limit(1)
        .execute();

      if (records.length === 0) {
        throw new Error("写作风格不存在");
      }

      return records[0] as WritingStyle;
    } catch (error) {
      console.error("更新小说写作风格失败:", error);
      throw error;
    }
  }
);

ipcMain.handle("writingStyle:delete", async (_event, id: string) => {
  try {
    await appDb.delete(writingStyle).where(eq(writingStyle.id, id));

    const current = await SettingsService.get();
    if (current.novel.selectedNovelStyleId === id) {
      await SettingsService.update(
        getShape(settingsShape.novel.selectedNovelStyleId),
        "default"
      );
    }

    return { success: true };
  } catch (error) {
    console.error("删除小说写作风格失败:", error);
    throw error;
  }
});
