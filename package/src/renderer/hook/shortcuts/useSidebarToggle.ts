import { useEffect } from "react";
import { toggleLeftSidebar } from "@/hook/app/useViewManager";

/**
 * 处理 Command+B 切换左侧边栏的逻辑
 *
 * @param enabled - 是否启用该快捷键（默认 true）
 */
export const useSidebarToggle = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleToggleShortcut = (event: KeyboardEvent) => {
      const key = event.key?.toLowerCase();

      // 检查是否是 Command+B (Mac) 或 Ctrl+B (Windows/Linux)
      const isCommandB = event.metaKey && key === "b";
      const isCtrlB = event.ctrlKey && key === "b";

      if (!(isCommandB || isCtrlB)) return;

      // 检查是否有其他修饰键
      if (event.altKey || event.shiftKey) return;

      // 如果是 Command+B，还要确保 Ctrl 没有按下
      if (isCommandB && event.ctrlKey) return;

      // 如果是 Ctrl+B，还要确保 Meta 没有按下
      if (isCtrlB && event.metaKey) return;

      // 如果有选中文字，不触发（让编辑器处理加粗）
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) return;

      event.preventDefault();

      // 切换侧边栏
      toggleLeftSidebar();
    };

    window.addEventListener("keydown", handleToggleShortcut);
    return () => {
      window.removeEventListener("keydown", handleToggleShortcut);
    };
  }, [enabled]);
};

