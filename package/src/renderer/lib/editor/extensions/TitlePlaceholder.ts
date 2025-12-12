/**
 * Title Placeholder Extension
 * 处理两种 placeholder 情况：
 * 1. 空的 title 节点 - 始终显示 placeholder
 * 2. 当正文为空时 - 第一个普通节点显示 placeholder（即使 focus 在 title）
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface TitlePlaceholderOptions {
  titlePlaceholder: string;
  emptyContentPlaceholder: string;
}

export const TitlePlaceholder = Extension.create<TitlePlaceholderOptions>({
  name: "titlePlaceholder",
  priority: 50, // 比 Placeholder 扩展更低的优先级，确保最后处理

  addOptions() {
    return {
      titlePlaceholder: "Untitled",
      emptyContentPlaceholder: "Type / for commands...",
    };
  },

  addProseMirrorPlugins() {
    const { titlePlaceholder, emptyContentPlaceholder } = this.options;

    return [
      new Plugin({
        key: new PluginKey("titlePlaceholder"),
        props: {
          decorations: (state) => {
            const { doc, selection } = state;
            const decorations: Decoration[] = [];
            const firstChild = doc.firstChild;

            // 1. 处理空的 title 节点（始终显示 placeholder）
            if (
              firstChild &&
              firstChild.type.name === "title" &&
              firstChild.content.size === 0
            ) {
              decorations.push(
                Decoration.node(0, firstChild.nodeSize, {
                  class: "is-empty",
                  "data-placeholder": titlePlaceholder,
                })
              );
            }

            // 2. 检查正文是否为空（title 之后的内容）
            if (firstChild && firstChild.type.name === "title") {
              const titleEnd = firstChild.nodeSize;
              let isContentEmpty = true;
              let firstContentNodePos = -1;
              let firstContentNodeSize = 0;

              // 遍历 title 之后的所有节点
              doc.nodesBetween(titleEnd, doc.content.size, (node, pos) => {
                if (pos >= titleEnd) {
                  // 记录第一个内容节点
                  if (firstContentNodePos === -1) {
                    firstContentNodePos = pos;
                    firstContentNodeSize = node.nodeSize;
                  }
                  // 检查是否有内容
                  if (node.isTextblock && node.content.size > 0) {
                    isContentEmpty = false;
                    return false; // 停止遍历
                  }
                }
                return true;
              });

              // 如果正文为空且有第一个内容节点
              if (isContentEmpty && firstContentNodePos >= 0) {
                // 只有当光标在 title 内时才添加 placeholder
                // （因为 Placeholder 扩展会处理光标在内容节点内的情况）
                const isCursorInTitle =
                  firstChild &&
                  selection.$from.pos >= 0 &&
                  selection.$from.pos <= firstChild.nodeSize;

                if (isCursorInTitle) {
                  decorations.push(
                    Decoration.node(
                      firstContentNodePos,
                      firstContentNodePos + firstContentNodeSize,
                      {
                        class: "is-empty is-content-empty",
                        "data-placeholder": emptyContentPlaceholder,
                      }
                    )
                  );
                }
              }
            }

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
