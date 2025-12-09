import { useEffect } from "react";
import {
  getCurrentViewManager,
  openBayBar,
  closeBayBar,
} from "@/hooks/app/useViewManager";
import { useThreadStore } from "@/hooks/chat/useThread";

/**
 * 处理 Command+L 聚焦到 ChatInput 的逻辑
 * 处理 Command+Shift+L 创建新对话并聚焦
 * 处理 Command+R 创建新对话并聚焦
 *
 * @param enabled - 是否启用该快捷键（默认 true）
 * @param autoToggleBaybar - 是否自动切换 Baybar（打开/关闭，默认 false）
 */
export const useChatInputFocus = (
  enabled: boolean = true,
  autoToggleBaybar: boolean = false
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleFocusShortcut = async (event: KeyboardEvent) => {
      const key = event.key?.toLowerCase();

      // Command+R / Ctrl+R: 创建新对话并聚焦
      if ((event.metaKey || event.ctrlKey) && key === "r" && !event.shiftKey && !event.altKey) {
        event.preventDefault();

        const isBayBarOpen = getCurrentViewManager().isBayBarOpen;

        // 创建新对话（如果当前已是空的新线程则跳过）
        await useThreadStore.getState().selectThread();

        // 如果 Baybar 未打开，先打开
        if (!isBayBarOpen) {
          openBayBar();
          setTimeout(() => {
            focusChatInput();
          }, 350);
        } else {
          focusChatInput();
        }
        return;
      }

      // 检查是否是 Command+L (Mac) 或 Ctrl+L (Windows/Linux)
      const isCommandL = event.metaKey && key === "l";
      const isCtrlL = event.ctrlKey && key === "l";

      if (!(isCommandL || isCtrlL)) return;

      // 检查是否有 Alt 修饰键
      if (event.altKey) return;

      // Command+Shift+L / Ctrl+Shift+L: 创建新对话并聚焦
      if (event.shiftKey) {
        event.preventDefault();

        const isBayBarOpen = getCurrentViewManager().isBayBarOpen;

        // 创建新对话（如果当前已是空的新线程则跳过）
        await useThreadStore.getState().selectThread();

        // 如果 Baybar 未打开，先打开
        if (!isBayBarOpen) {
          openBayBar();
          setTimeout(() => {
            focusChatInput();
          }, 350);
        } else {
          focusChatInput();
        }
        return;
      }

      // Command+L / Ctrl+L: 原有逻辑

      // 如果是 Command+L，还要确保 Ctrl 没有按下
      if (isCommandL && event.ctrlKey) return;

      // 如果是 Ctrl+L，还要确保 Meta 没有按下
      if (isCtrlL && event.metaKey) return;

      event.preventDefault();

      const activeElement = document.activeElement as HTMLElement | null;
      const isBayBarOpen = getCurrentViewManager().isBayBarOpen;

      // 检查当前是否聚焦在 ChatInput 的编辑器上
      const isChatInputFocused = activeElement?.matches(
        '[data-chat-input="true"]'
      );

      // 如果启用自动切换 Baybar
      if (autoToggleBaybar) {
        // 场景1: Baybar 未打开 -> 打开并聚焦
        if (!isBayBarOpen) {
          openBayBar();
          // 等待 Baybar 动画完成后再聚焦
          setTimeout(() => {
            focusChatInput();
          }, 350); // 动画时间 300ms + 50ms 缓冲
          return;
        }

        // 场景2: Baybar 已打开且聚焦在 ChatInput -> 关闭 Baybar
        if (isChatInputFocused) {
          closeBayBar();
          return;
        }

        // 场景3: Baybar 已打开但未聚焦 -> 聚焦到 ChatInput
        focusChatInput();
        return;
      }

      // 如果没有启用自动切换，检查是否在其他输入框中
      // 注意：如果已经在 ChatInput 中，则允许继续执行（虽然通常意味着什么都不做，或者重新聚焦）
      if (
        activeElement?.closest("textarea, input, [contenteditable='true']") &&
        !isChatInputFocused
      ) {
        return;
      }

      // 直接聚焦
      focusChatInput();
    };

    window.addEventListener("keydown", handleFocusShortcut);
    return () => {
      window.removeEventListener("keydown", handleFocusShortcut);
    };
  }, [enabled, autoToggleBaybar]);
};

/**
 * 聚焦到 ChatInput 的编辑器
 */
const focusChatInput = () => {
  const editor = document.querySelector<HTMLElement>(
    '[data-chat-input="true"]'
  );

  if (editor) {
    editor.focus();
    // 对于 contenteditable 元素，focus() 通常会将光标放在最后，或者上次的位置
    // 如果需要强制光标在最后，需要更复杂的 Range 操作，但通常 Tiptap 会处理得很好
  }
};
