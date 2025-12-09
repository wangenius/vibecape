import { useEffect } from "react";
import { openSettingsDialog } from "@/layouts/settings";

/**
 * 处理 Command+, 切换设置面板的逻辑
 *
 * @param enabled - 是否启用该快捷键（默认 true）
 */
export const useSettingsToggle = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleToggleShortcut = (event: KeyboardEvent) => {
      const key = event.key;

      // 检查是否是 Command+, (Mac) 或 Ctrl+, (Windows/Linux)
      const isCommandComma = event.metaKey && key === ",";
      const isCtrlComma = event.ctrlKey && key === ",";

      if (!(isCommandComma || isCtrlComma)) return;

      // 检查是否有其他修饰键
      if (event.altKey || event.shiftKey) return;

      // 如果是 Command+,，还要确保 Ctrl 没有按下
      if (isCommandComma && event.ctrlKey) return;

      // 如果是 Ctrl+,，还要确保 Meta 没有按下
      if (isCtrlComma && event.metaKey) return;

      event.preventDefault();

      // 打开设置对话框
      openSettingsDialog();
    };

    window.addEventListener("keydown", handleToggleShortcut);
    return () => {
      window.removeEventListener("keydown", handleToggleShortcut);
    };
  }, [enabled]);
};
