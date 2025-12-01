/**
 * 自定义键盘快捷键扩展
 * - Cmd+A: 渐进式选择（先选段落，再选全文）
 * - Alt+Backspace: 删除到上一个标点符号
 */

import { Extension } from "@tiptap/core";

// 标点符号（中英文）
const PUNCTUATION_CHARS = `，。！？；：、""''（）【】《》—…,.!?;:'"()[]<>-·`;

function isPunctuation(char: string): boolean {
  return PUNCTUATION_CHARS.includes(char);
}

// 记录上次选中的段落范围
let lastParagraphRange: { from: number; to: number } | null = null;

export const CustomKeyboardExtension = Extension.create({
  name: "customKeyboard",

  addKeyboardShortcuts() {
    return {
      // Cmd+A: 渐进式选择
      "Mod-a": ({ editor }) => {
        const { state } = editor;
        const { selection, doc } = state;
        const { $from } = selection;

        const paragraphStart = $from.start($from.depth);
        const paragraphEnd = $from.end($from.depth);
        const docStart = 0;
        const docEnd = doc.content.size;

        const isCurrentParagraphSelected =
          selection.from === paragraphStart && selection.to === paragraphEnd;

        const wasLastSelectParagraph =
          lastParagraphRange?.from === paragraphStart &&
          lastParagraphRange?.to === paragraphEnd;

        if (isCurrentParagraphSelected || wasLastSelectParagraph) {
          editor.chain().focus().setTextSelection({ from: docStart, to: docEnd }).run();
          lastParagraphRange = null;
        } else {
          editor.chain().focus().setTextSelection({ from: paragraphStart, to: paragraphEnd }).run();
          lastParagraphRange = { from: paragraphStart, to: paragraphEnd };
        }

        return true;
      },

      // Alt+Backspace: 删除到上一个标点符号（如果紧邻标点则删除该标点）
      "Alt-Backspace": ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { from } = selection;

        // 获取光标前的文本
        const $from = state.doc.resolve(from);
        const blockStart = $from.start($from.depth);
        const textBefore = state.doc.textBetween(blockStart, from, "");

        if (!textBefore) return false;

        const lastChar = textBefore[textBefore.length - 1];
        
        // 如果光标前一位是标点，删除这个标点
        if (isPunctuation(lastChar)) {
          editor.chain().focus().deleteRange({ from: from - 1, to: from }).run();
          return true;
        }

        // 从后往前找标点符号
        let deleteStart = blockStart;
        for (let i = textBefore.length - 1; i >= 0; i--) {
          if (isPunctuation(textBefore[i])) {
            deleteStart = blockStart + i + 1;
            break;
          }
        }

        // 删除从标点符号后到光标的内容
        if (deleteStart < from) {
          editor.chain().focus().deleteRange({ from: deleteStart, to: from }).run();
          return true;
        }

        return false;
      },
    };
  },
});
