import { useEffect } from "react";

/**
 * 处理 Command+I 聚焦到 DocEditor 末尾的逻辑
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

      // 聚焦到 DocEditor 末尾
      focusDocEditorEnd();
    };

    window.addEventListener("keydown", handleFocusShortcut);
    return () => {
      window.removeEventListener("keydown", handleFocusShortcut);
    };
  }, [enabled]);
};

/**
 * 聚焦到 DocEditor 的末尾
 */
const focusDocEditorEnd = () => {
  // 查找 ProseMirror 编辑器实例
  const proseMirrorElement = document.querySelector<HTMLElement>(
    ".ProseMirror[contenteditable='true']"
  );

  if (proseMirrorElement) {
    // 聚焦到编辑器
    proseMirrorElement.focus();

    // 将光标移动到末尾
    const selection = window.getSelection();
    if (selection) {
      // 获取最后一个可编辑节点
      const range = document.createRange();
      range.selectNodeContents(proseMirrorElement);
      range.collapse(false); // false 表示折叠到末尾
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
};
