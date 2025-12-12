/**
 * Heading Placeholder Extension
 * 为空标题添加 data-placeholder 属性，使其始终显示 placeholder
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface HeadingPlaceholderOptions {
  getPlaceholder: (level: number) => string;
}

export const HeadingPlaceholder = Extension.create<HeadingPlaceholderOptions>({
  name: "headingPlaceholder",

  addOptions() {
    return {
      getPlaceholder: (level: number) => `Heading ${level}`,
    };
  },

  addProseMirrorPlugins() {
    const { getPlaceholder } = this.options;

    return [
      new Plugin({
        key: new PluginKey("headingPlaceholder"),
        props: {
          decorations: (state) => {
            const { doc, selection } = state;
            const decorations: Decoration[] = [];

            doc.descendants((node, pos) => {
              // 只处理空的 heading 节点
              if (node.type.name === "heading" && node.content.size === 0) {
                const level = node.attrs.level;
                const placeholder = getPlaceholder(level);

                // 检查当前节点是否被选中（光标在内）
                const isFocused =
                  selection.$from.pos >= pos &&
                  selection.$from.pos <= pos + node.nodeSize;

                // 如果没有被选中，才添加装饰（因为被选中时 Placeholder 扩展会处理）
                if (!isFocused) {
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      class: "is-empty",
                      "data-placeholder": placeholder,
                    })
                  );
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
