/**
 * AI Diff Mark Extension
 *
 * 简化设计：使用单一 Mark 标记 AI 生成的内容
 * - 新内容显示为绿色高亮
 * - Mark 的 attrs 中保存原文，用于 Reject 时恢复
 * - Accept: 只需移除 mark
 * - Reject: 用原文替换当前内容
 */

import { Mark, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface AIDiffMarkOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiDiff: {
      /** 设置 AI Diff 标记 */
      setAIDiff: (attrs: { diffId: string; originalText: string }) => ReturnType;
      /** 移除 AI Diff 标记 */
      unsetAIDiff: () => ReturnType;
    };
  }
}

const diffPluginKey = new PluginKey("aiDiffWidget");

/**
 * AI Diff Mark - 标记 AI 生成的待确认内容
 * 
 * attrs:
 * - diffId: 唯一标识
 * - originalText: 原文（用于 Reject 时恢复）
 */
export const AIDiffMark = Mark.create<AIDiffMarkOptions>({
  name: "aiDiff",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      diffId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-diff-id"),
        renderHTML: (attributes) => {
          if (!attributes.diffId) return {};
          return { "data-diff-id": attributes.diffId };
        },
      },
      originalText: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-original-text") || "",
        renderHTML: (attributes) => {
          if (!attributes.originalText) return {};
          return { "data-original-text": attributes.originalText };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-ai-diff]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-ai-diff": "pending",
        class: "ai-diff-pending",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setAIDiff:
        (attrs) =>
        ({ commands }) => {
          return commands.setMark(this.name, attrs);
        },
      unsetAIDiff:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: diffPluginKey,
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const processedDiffIds = new Set<string>();

            // 遍历文档找到所有 aiDiff mark 的结束位置
            state.doc.descendants((node, pos) => {
              if (!node.isText) return;

              const diffMark = node.marks.find(
                (m) => m.type.name === "aiDiff" && m.attrs.diffId
              );

              if (diffMark) {
                const diffId = diffMark.attrs.diffId;
                const endPos = pos + node.nodeSize;

                // 检查下一个节点是否还有相同的 mark
                const nextNode = state.doc.nodeAt(endPos);
                const nextHasSameMark = nextNode?.marks.some(
                  (m) => m.type.name === "aiDiff" && m.attrs.diffId === diffId
                );

                // 只在 mark 的最后一个位置添加 widget
                if (!nextHasSameMark && !processedDiffIds.has(diffId)) {
                  processedDiffIds.add(diffId);

                  // 创建 Accept/Reject 按钮 widget
                  const widget = Decoration.widget(
                    endPos,
                    () => {
                      const container = document.createElement("span");
                      container.className = "ai-diff-actions";
                      container.contentEditable = "false";

                      // Accept 按钮
                      const acceptBtn = document.createElement("button");
                      acceptBtn.className = "ai-diff-btn ai-diff-btn-accept";
                      acceptBtn.innerHTML = "✓";
                      acceptBtn.title = "Accept";
                      acceptBtn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        editor.commands.acceptAIDiff(diffId);
                      };

                      // Reject 按钮
                      const rejectBtn = document.createElement("button");
                      rejectBtn.className = "ai-diff-btn ai-diff-btn-reject";
                      rejectBtn.innerHTML = "✕";
                      rejectBtn.title = "Reject";
                      rejectBtn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        editor.commands.rejectAIDiff(diffId);
                      };

                      container.appendChild(acceptBtn);
                      container.appendChild(rejectBtn);

                      return container;
                    },
                    { side: 1 }
                  );

                  decorations.push(widget);
                }
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
