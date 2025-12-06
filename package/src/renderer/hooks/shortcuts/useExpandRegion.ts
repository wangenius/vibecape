import { useEffect } from "react";
import type { Editor } from "@tiptap/core";

/**
 * 扩展选区（expand-region）功能
 * 监听 IPC 事件 shortcut:expand-region，触发选区扩展
 * 扩展顺序：单词 → 段落 → 全文
 */
export const useExpandRegion = (editor: Editor | null) => {
  useEffect(() => {
    if (!editor) return;

    const handleExpandRegion = () => {
      if (!editor.isFocused) return;

      const { state } = editor;
      const { selection, doc } = state;
      const { from, to, $from, $to } = selection;

      // 如果没有选中内容，先选中当前单词
      if (from === to) {
        const wordStart = $from.start($from.depth);
        const wordEnd = $from.end($from.depth);
        const textBefore = doc.textBetween(wordStart, from, "");
        const textAfter = doc.textBetween(to, wordEnd, "");

        // 找单词边界（中英文标点和空格）
        const boundaryRegex = /[\s，。！？；：、""''（）【】《》—…,.!?;:'"()\[\]<>\-·]/;
        let ws = from,
          we = to;

        for (let i = textBefore.length - 1; i >= 0; i--) {
          if (boundaryRegex.test(textBefore[i])) break;
          ws = wordStart + i;
        }
        for (let i = 0; i < textAfter.length; i++) {
          if (boundaryRegex.test(textAfter[i])) break;
          we = to + i + 1;
        }

        if (ws < we) {
          editor
            .chain()
            .focus()
            .setTextSelection({ from: ws, to: we })
            .run();
          return;
        }
      }

      // 已有选中内容，尝试扩展到段落
      const paragraphStart = $from.start($from.depth);
      const paragraphEnd = $to.end($to.depth);

      if (from !== paragraphStart || to !== paragraphEnd) {
        editor
          .chain()
          .focus()
          .setTextSelection({ from: paragraphStart, to: paragraphEnd })
          .run();
        return;
      }

      // 已选中段落，扩展到全文
      const docStart = 0;
      const docEnd = doc.content.size;
      if (from !== docStart || to !== docEnd) {
        editor
          .chain()
          .focus()
          .setTextSelection({ from: docStart, to: docEnd })
          .run();
        return;
      }
    };

    // 监听 IPC 事件
    const removeListener = window.electron.ipcRenderer.on(
      "shortcut:expand-region",
      handleExpandRegion
    );

    return () => {
      if (typeof removeListener === "function") {
        removeListener();
      } else {
        window.electron.ipcRenderer.removeAllListeners("shortcut:expand-region");
      }
    };
  }, [editor]);
};
