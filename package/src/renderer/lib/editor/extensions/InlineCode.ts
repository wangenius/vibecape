/**
 * 自定义 Inline Code 扩展
 * 使用 Fira Code 字体
 */

import { Mark, mergeAttributes, markInputRule } from "@tiptap/core";

// 匹配 `code` 格式的正则 - 第一个捕获组是完整匹配，第二个是内容
const inputRegex = /(?:^|[^`])(`([^`]+)`)$/;

export const InlineCode = Mark.create({
  name: "code",

  excludes: "_",

  code: true,

  exitable: true,

  parseHTML() {
    return [{ tag: "code" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "code",
      mergeAttributes(HTMLAttributes, {
        class: "inline-code",
      }),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      "Mod-e": () => this.editor.commands.toggleMark(this.name),
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: inputRegex,
        type: this.type,
      }),
    ];
  },
});
