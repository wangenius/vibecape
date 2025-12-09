import { useEffect } from "react";
import { useEditorStore } from "@/hooks/stores/useEditorStore";

/**
 * 处理 Command+I 聚焦到 DocEditor 末尾的逻辑
 * 使用 Tiptap editor 实例的 commands.focus("end") 而非 DOM 操作
 *
 * @param enabled - 是否启用该快捷键（默认 true）
 */
export const useDocEditorFocus = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleFocusShortcut = (event: KeyboardEvent) => {
      const key = event.key?.toLowerCase();

      // 检查是否是 Command+I (Mac) 或 Ctrl+I (Windows/Linux)
      const isCommandI = event.metaKey && key === "i";
      const isCtrlI = event.ctrlKey && key === "i";

      if (!(isCommandI || isCtrlI)) return;

      // 检查是否有其他修饰键
      if (event.altKey || event.shiftKey) return;

      // 如果是 Command+I，还要确保 Ctrl 没有按下
      if (isCommandI && event.ctrlKey) return;

      // 如果是 Ctrl+I，还要确保 Meta 没有按下
      if (isCtrlI && event.metaKey) return;

      event.preventDefault();

      // 使用 store 中的 editor 实例聚焦到末尾
      useEditorStore.getState().focusEnd();
    };

    window.addEventListener("keydown", handleFocusShortcut);
    return () => {
      window.removeEventListener("keydown", handleFocusShortcut);
    };
  }, [enabled]);
};
