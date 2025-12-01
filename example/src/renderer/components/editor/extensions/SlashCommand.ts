/**
 * Slash Command 扩展
 * 封装 Suggestion 插件以支持 / 命令
 */

import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        pluginKey: new PluginKey("slashSuggestion"),
        ...this.options.suggestion,
      }),
    ];
  },
});

