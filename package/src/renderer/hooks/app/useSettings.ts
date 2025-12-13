import { create } from "zustand";
import type { AppConfig } from "@common/schema/config";
import { DEFAULT_APP_CONFIG } from "@common/schema/config";
import { createShape, getShape, type ShapeRef } from "@common/lib/shape";

const appConfigShape = createShape(DEFAULT_APP_CONFIG);

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

// 应用主题到 DOM
function applyTheme(mode: "light" | "dark", theme: string) {
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.setAttribute("data-theme", theme);
}

// 监听系统主题变化
let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;

function setupSystemThemeListener() {
  const settings = useSettingsStore.getState();
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  // 移除旧的监听器
  if (systemThemeListener) {
    mediaQuery.removeEventListener("change", systemThemeListener);
  }

  // 如果开启了跟随系统，设置新的监听器
  if (settings.ui.follow_system_mode) {
    systemThemeListener = (e: MediaQueryListEvent) => {
      const currentSettings = useSettingsStore.getState();
      if (currentSettings.ui.follow_system_mode) {
        const newMode = e.matches ? "dark" : "light";
        applyTheme(newMode, currentSettings.ui.theme);
        // 更新设置
        void window.api.app.settings
          .update(getShape(appConfigShape.ui.mode), newMode)
          .then((next) => {
            if (next) {
              useSettingsStore.getState().setSettings(next);
            }
          });
      }
    };
    mediaQuery.addEventListener("change", systemThemeListener);

    // 立即应用当前系统主题
    const isDark = mediaQuery.matches;
    applyTheme(isDark ? "dark" : "light", settings.ui.theme);
  }
}

export async function initSettings() {
  try {
    const settings = await window.api.app.settings.get();
    if (settings) {
      useSettingsStore.getState().setSettings(settings);

      // 如果开启了跟随系统，应用系统主题
      if (settings.ui.follow_system_mode) {
        const isDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        applyTheme(isDark ? "dark" : "light", settings.ui.theme);
      } else {
        applyTheme(settings.ui.mode, settings.ui.theme);
      }

      // 设置系统主题监听
      setupSystemThemeListener();
    }
  } catch (error) {
    console.error("初始化设置失败:", error);
  }
}

// 订阅设置变化，更新系统主题监听器
useSettingsStore.subscribe((state, prevState) => {
  // 当 follow_system_mode 变化时，重新设置监听器
  if (state.ui.follow_system_mode !== prevState.ui.follow_system_mode) {
    setupSystemThemeListener();
  }
  // 当主题变化时（非跟随系统模式下），应用主题
  if (
    !state.ui.follow_system_mode &&
    (state.ui.mode !== prevState.ui.mode ||
      state.ui.theme !== prevState.ui.theme)
  ) {
    applyTheme(state.ui.mode, state.ui.theme);
  }
  // 当主题色变化时，应用主题
  if (state.ui.theme !== prevState.ui.theme) {
    document.documentElement.setAttribute("data-theme", state.ui.theme);
  }
});

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
