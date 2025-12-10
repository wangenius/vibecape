/**
 * Mention Command 扩展
 * 封装 Suggestion 插件以支持 @ 提及
 */

import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";

export const MentionCommand = Extension.create({
  name: "mentionCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        pluginKey: new PluginKey("mentionSuggestion"),
        ...this.options.suggestion,
      }),
    ];
  },
});

