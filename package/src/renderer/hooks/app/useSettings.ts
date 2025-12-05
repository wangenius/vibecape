import { create } from "zustand";
import type { AppConfig } from "@common/schema/config";
import { DEFAULT_APP_CONFIG } from "@common/schema/config";
import { getShape, type ShapeRef } from "@common/lib/shape";

export interface SettingsStoreState extends AppConfig {
  setSettings: (next: AppConfig) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  ...DEFAULT_APP_CONFIG,
  setSettings: (next) => set(() => next),
  reset: () => set(() => DEFAULT_APP_CONFIG),
}));

export function useSettings<T = SettingsStoreState>(
  selector?: (state: SettingsStoreState) => T
): T {
  return useSettingsStore(selector ?? ((state) => state as T));
}

export function getCurrentSettings() {
  return useSettingsStore.getState();
}

export async function initSettings() {
  try {
    const settings = await window.api.app.settings.get();
    if (settings) {
      useSettingsStore.getState().setSettings(settings);

      // 同步更新 i18n 语言
      const { default: i18n } = await import("@/lib/locales/i18n");
      if (settings.ui.language && settings.ui.language !== i18n.language) {
        await i18n.changeLanguage(settings.ui.language);
      }

      // 同步应用主题
      const root = document.documentElement;
      if (settings.ui.mode === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      root.setAttribute("data-theme", settings.ui.theme);
    }
  } catch (error) {
    console.error("初始化设置失败:", error);
  }
}

export async function updateSettings<V>(
  field: ShapeRef<V>,
  value: V
): Promise<AppConfig | undefined> {
  try {
    const next = await window.api.app.settings.update(getShape(field), value);
    if (next) {
      useSettingsStore.getState().setSettings(next);
    }
    return next;
  } catch (error) {
    console.error("保存设置失败:", error);
    throw error;
  }
}

void initSettings();
