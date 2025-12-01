import { create } from "zustand";
import type { SettingsData } from "@common/schema/app";
import { getShape, type ShapeRef } from "@common/lib/shape";
import { SETTINGS_DEFAULTS } from "@common/config/settings";

export interface SettingsStoreState extends SettingsData {
  setSettings: (next: SettingsData) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  ...SETTINGS_DEFAULTS,
  setSettings: (next) => set(() => next),
  reset: () => set(() => SETTINGS_DEFAULTS),
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
    }
  } catch (error) {
    console.error("初始化设置失败:", error);
  }
}

export async function updateSettings<V>(
  field: ShapeRef<V>,
  value: V
): Promise<SettingsData | undefined> {
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
