"use client";

import { useEffect } from "react";
import { toggleBayBar, getBayBarOpen } from "../hook/useView";

/**
 * 处理 Command+I 聚焦到 ChatInput 的逻辑
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

      const activeElement = document.activeElement as HTMLElement | null;
      const isBayBarOpen = getBayBarOpen();

      // 检查当前是否聚焦在 ChatInput 的 textarea 上
      const isChatInputFocused = activeElement?.matches(
        "textarea[name='message']"
      );

      // 如果启用自动切换 Baybar
      if (autoToggleBaybar) {
        // 场景1: Baybar 未打开 -> 打开并聚焦
        if (!isBayBarOpen) {
          toggleBayBar(true);
          // 等待 Baybar 动画完成后再聚焦
          setTimeout(() => {
            focusChatInput();
          }, 350); // 动画时间 300ms + 50ms 缓冲
          return;
        }

        // 场景2: Baybar 已打开且聚焦在 ChatInput -> 关闭 Baybar
        if (isChatInputFocused) {
          toggleBayBar(false);
          return;
        }

        // 场景3: Baybar 已打开但未聚焦 -> 聚焦到 ChatInput
        focusChatInput();
        return;
      }

      // 如果没有启用自动切换，检查是否在其他输入框中
      if (activeElement?.closest("textarea, input, [contenteditable='true']")) {
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
 * 聚焦到 ChatInput 的 textarea
 */
const focusChatInput = () => {
  const textarea = document.querySelector<HTMLTextAreaElement>(
    "textarea[name='message']"
  );

  if (textarea) {
    textarea.focus();
    // 将光标移动到文本末尾
    const valueLength = textarea.value.length;
    textarea.setSelectionRange(valueLength, valueLength);
  }
};
