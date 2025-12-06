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
      /** 接受 AI Diff：移除 mark，保留新内容 */
      acceptAIDiff: (diffId: string) => ReturnType;
      /** 拒绝 AI Diff：用原文替换新内容 */
      rejectAIDiff: (diffId: string) => ReturnType;
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
      /** 接受 AI Diff：移除 mark，保留新内容 */
      acceptAIDiff:
        (diffId: string) =>
        ({ state, tr, dispatch }) => {
          const markType = state.schema.marks.aiDiff;
          if (!markType) return false;

          let found = false;

          // 找到所有带有该 diffId 的 mark 并移除
          state.doc.descendants((node, pos) => {
            if (!node.isText) return;
            const mark = node.marks.find(
              (m) => m.type === markType && m.attrs.diffId === diffId
            );
            if (mark) {
              tr.removeMark(pos, pos + node.nodeSize, mark);
              found = true;
            }
          });

          if (found && dispatch) dispatch(tr);
          return found;
        },
      /** 拒绝 AI Diff：用原文替换新内容 */
      rejectAIDiff:
        (diffId: string) =>
        ({ state, tr, dispatch }) => {
          const markType = state.schema.marks.aiDiff;
          if (!markType) return false;

          // 找到带有该 diffId 的 mark 范围和原文
          let markFrom: number | null = null;
          let markTo: number | null = null;
          let originalText = "";

          state.doc.descendants((node, pos) => {
            if (!node.isText) return;
            const mark = node.marks.find(
              (m) => m.type === markType && m.attrs.diffId === diffId
            );
            if (mark) {
              if (markFrom === null) {
                markFrom = pos;
                originalText = mark.attrs.originalText || "";
              }
              markTo = pos + node.nodeSize;
            }
          });

          if (markFrom === null || markTo === null) return false;

          // 用原文替换当前内容
          const textNode = state.schema.text(originalText);
          tr.replaceWith(markFrom, markTo, textNode);

          if (dispatch) dispatch(tr);
          return true;
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

            // 收集每个 diffId 的信息
            const diffInfoMap = new Map<
              string,
              { startPos: number; endPos: number; originalText: string }
            >();

            // 遍历文档找到所有 aiDiff mark
            state.doc.descendants((node, pos) => {
              if (!node.isText) return;

              const diffMark = node.marks.find(
                (m) => m.type.name === "aiDiff" && m.attrs.diffId
              );

              if (diffMark) {
                const diffId = diffMark.attrs.diffId;
                const endPos = pos + node.nodeSize;

                if (!diffInfoMap.has(diffId)) {
                  diffInfoMap.set(diffId, {
                    startPos: pos,
                    endPos,
                    originalText: diffMark.attrs.originalText || "",
                  });
                } else {
                  const info = diffInfoMap.get(diffId)!;
                  info.endPos = endPos;
                }
              }
            });

            // 为每个 diff 创建 decorations
            for (const [diffId, info] of diffInfoMap) {
              if (processedDiffIds.has(diffId)) continue;
              processedDiffIds.add(diffId);

              // 1. 在开始位置添加被删除的原文（红色划掉）
              if (info.originalText) {
                const deletedWidget = Decoration.widget(
                  info.startPos,
                  () => {
                    const span = document.createElement("span");
                    span.className = "ai-diff-deleted";
                    span.textContent = info.originalText;
                    span.contentEditable = "false";
                    return span;
                  },
                  { side: -1 }
                );
                decorations.push(deletedWidget);
              }

              // 2. 在结束位置添加 Accept/Reject 按钮
              const actionsWidget = Decoration.widget(
                info.endPos,
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

              decorations.push(actionsWidget);
            }

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
