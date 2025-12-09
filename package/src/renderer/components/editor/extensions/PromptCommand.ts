/**
 * Prompt Command 扩展
 * 封装 Suggestion 插件以支持 # 选择 Prompt
 */

import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";

export const PromptCommand = Extension.create({
  name: "promptCommand",

  addOptions() {
    return {
      suggestion: {
        char: "#",
        items: () => [],
        render: () => ({}),
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        pluginKey: new PluginKey("promptSuggestion"),
        ...this.options.suggestion,
      }),
    ];
  },
});
