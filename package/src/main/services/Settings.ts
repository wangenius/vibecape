import { eq } from "drizzle-orm";
import { appDb } from "../db/app";
import { settings, type SettingsData } from "@common/schema/app";
import { SETTINGS_DEFAULTS } from "@common/config/settings";
import { setShape, type Shape } from "@common/lib/shape";

const SETTINGS_KEY = "app_settings";

function mergeSettings(
  stored: Partial<SettingsData> | undefined
): SettingsData {
  return {
    ui: {
      ...SETTINGS_DEFAULTS.ui,
      ...(stored?.ui ?? {}),
    },
    model: {
      ...SETTINGS_DEFAULTS.model,
      ...(stored?.model ?? {}),
    },
    general: {
      ...SETTINGS_DEFAULTS.general,
      ...(stored?.general ?? {}),
      proxy: {
        ...SETTINGS_DEFAULTS.general.proxy,
        ...(stored?.general?.proxy ?? {}),
      },
    },
  };
}

export class SettingsService {
  private static cache: SettingsData = SETTINGS_DEFAULTS;
  private static initialized = false;
  private static initPromise: Promise<void> | null = null;

  static async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.load()
        .catch((error) => {
          console.error("[SettingsService] 初始化失败:", error);
        })
        .finally(() => {
          this.initPromise = null;
        });
    }
    await this.initPromise;
  }

  private static async load(): Promise<void> {
    console.log("[SettingsService] Loading settings from DB...");
    const rows = await appDb
      .select()
      .from(settings)
      .where(eq(settings.key, SETTINGS_KEY))
      .limit(1)
      .execute();

    const stored = rows[0]?.value as Partial<SettingsData> | undefined;
    console.log("[SettingsService] Stored settings from DB:", JSON.stringify(stored, null, 2));
    this.cache = mergeSettings(stored);
    console.log("[SettingsService] Merged cache:", JSON.stringify(this.cache, null, 2));
    this.initialized = true;
  }

  private static async ensureInit(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  static getCache(): SettingsData {
    return this.cache;
  }

  static async get(): Promise<SettingsData> {
    await this.ensureInit();
    return this.cache;
  }

  static async update(path: Shape, value: unknown): Promise<SettingsData> {
    await this.ensureInit();
    
    console.log("[SettingsService] Updating path:", path, "value:", value);

    this.cache = setShape(this.cache, path, value);
    
    console.log("[SettingsService] New cache to save:", JSON.stringify(this.cache, null, 2));

    try {
      // 尝试更新
      const result = await appDb
        .update(settings)
        .set({ value: this.cache })
        .where(eq(settings.key, SETTINGS_KEY))
        .run();

      if (result.rowsAffected === 0) {
        console.log("[SettingsService] No existing settings found, inserting new row");
        // 如果没有更新任何行，说明不存在，进行插入
        await appDb
          .insert(settings)
          .values({
            key: SETTINGS_KEY,
            value: this.cache,
          })
          .run();
      }
      console.log("[SettingsService] Settings persisted successfully");
    } catch (error) {
      console.error("[SettingsService] Failed to save settings:", error);
      throw error;
    }

    return this.cache;
  }
}

// 延迟初始化 - 等待数据库就绪后由 main/index.ts 触发
