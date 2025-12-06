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
import { Slice, Fragment } from "@tiptap/pm/model";
import { markdownToJSON } from "@common/lib/content-converter";

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
      // AI 生成的原始内容（包含 \n\n），用于 accept 时正确解析多段落
      rawContent: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-raw-content") || "",
        renderHTML: (attributes) => {
          if (!attributes.rawContent) return {};
          return { "data-raw-content": attributes.rawContent };
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
      /** 接受 AI Diff：删除原文（AIPolishMark），将 markdown 转换成节点后替换，删除 AIRewriteNode */
      acceptAIDiff:
        (diffId: string) =>
        ({ state, tr, dispatch, editor }) => {
          const diffMarkType = state.schema.marks.aiDiff;
          const polishMarkType = state.schema.marks.aiPolishMark;
          const rewriteNodeType = state.schema.nodes.aiRewrite;
          if (!diffMarkType) return false;

          // 1. 找到 diff mark 范围和内容
          let diffFrom = -1;
          let diffTo = -1;
          let diffContent = ""; // 使用 rawContent（包含 \n\n）而不是显示的文本

          state.doc.descendants((node, pos) => {
            if (!node.isText) return;
            const mark = node.marks.find(
              (m) => m.type === diffMarkType && m.attrs.diffId === diffId
            );
            if (mark) {
              if (diffFrom === -1) {
                diffFrom = pos;
                // 使用 rawContent（原始内容，包含 \n\n）而不是显示的文本
                diffContent = mark.attrs.rawContent || node.text || "";
              }
              diffTo = pos + node.nodeSize;
            }
          });

          if (diffFrom === -1) return false;

          // 2. 找到并删除原文（带 AIPolishMark streaming: true 的内容）
          // 检查是否需要删除整个 block
          if (polishMarkType) {
            const blocksToDelete: { from: number; to: number }[] = [];
            const processedBlocks = new Set<number>();
            let totalShift = 0;

            state.doc.descendants((node, pos) => {
              if (!node.isText) return true;
              const mark = node.marks.find(
                (m) => m.type === polishMarkType && m.attrs.streaming === true
              );
              if (mark) {
                // 找到包含这个文本的 block 节点
                const $pos = state.doc.resolve(pos);
                const blockStart = $pos.before($pos.depth);

                if (!processedBlocks.has(blockStart)) {
                  processedBlocks.add(blockStart);
                  const blockNode = state.doc.nodeAt(blockStart);

                  if (blockNode) {
                    // 检查这个 block 是否只包含被标记的文本
                    let allMarked = true;
                    blockNode.descendants((child) => {
                      if (child.isText) {
                        const hasMark = child.marks.some(
                          (m) => m.type === polishMarkType && m.attrs.streaming === true
                        );
                        if (!hasMark) {
                          allMarked = false;
                        }
                      }
                      return true;
                    });

                    if (allMarked) {
                      blocksToDelete.push({
                        from: blockStart,
                        to: blockStart + blockNode.nodeSize,
                      });
                    }
                  }
                }
              }
              return true;
            });

            if (blocksToDelete.length > 0) {
              // 删除整个 block
              blocksToDelete.sort((a, b) => b.from - a.from);
              for (const block of blocksToDelete) {
                tr.delete(block.from, block.to);
                if (block.from < diffFrom) {
                  totalShift += block.to - block.from;
                }
              }
            } else {
              // 只删除文本内容
              const polishRanges: { from: number; to: number }[] = [];

              state.doc.descendants((node, pos) => {
                if (!node.isText) return true;
                const mark = node.marks.find(
                  (m) => m.type === polishMarkType && m.attrs.streaming === true
                );
                if (mark) {
                  polishRanges.push({ from: pos, to: pos + node.nodeSize });
                }
                return true;
              });

              for (let i = polishRanges.length - 1; i >= 0; i--) {
                const range = polishRanges[i];
                tr.delete(range.from, range.to);
                if (range.from < diffFrom) {
                  totalShift += range.to - range.from;
                }
              }
            }

            // 更新 diff 位置
            if (totalShift > 0) {
              diffFrom -= totalShift;
              diffTo -= totalShift;
            }
          }

          // 3. 将 markdown 内容转换成 ProseMirror 节点并替换
          const jsonContent = markdownToJSON(diffContent);
          
          // 从 JSONContent 创建 ProseMirror 节点
          if (jsonContent.content && jsonContent.content.length > 0) {
            // 检查是否有多个段落
            if (jsonContent.content.length > 1) {
              // 多段落：需要将当前段落拆分或替换为多个段落
              // 找到包含 diff 的段落节点
              const $from = tr.doc.resolve(diffFrom);
              const blockStart = $from.before($from.depth);
              const blockNode = tr.doc.nodeAt(blockStart);
              
              if (blockNode) {
                const blockEnd = blockStart + blockNode.nodeSize;
                
                // 创建新的段落节点数组
                const newNodes: any[] = [];
                
                // 计算 diff 在段落内的相对位置
                const diffStartInBlock = diffFrom - blockStart - 1; // -1 是因为段落开始标签
                const diffEndInBlock = diffTo - blockStart - 1;
                
                // 获取段落内 diff 之前和之后的内容
                const blockText = blockNode.textContent;
                const textBefore = blockText.slice(0, diffStartInBlock);
                const textAfter = blockText.slice(diffEndInBlock);
                
                // 处理每个新段落
                jsonContent.content.forEach((block, index) => {
                  if (block.type === "paragraph") {
                    let content: any[] = [];
                    
                    if (index === 0 && textBefore) {
                      // 第一段：前面加上原来的内容
                      content.push({ type: "text", text: textBefore });
                    }
                    
                    if (block.content) {
                      content = content.concat(block.content);
                    }
                    
                    if (index === jsonContent.content!.length - 1 && textAfter) {
                      // 最后一段：后面加上原来的内容
                      content.push({ type: "text", text: textAfter });
                    }
                    
                    if (content.length > 0) {
                      newNodes.push(
                        editor.schema.nodes.paragraph.create(
                          null,
                          content.map((c) => editor.schema.nodeFromJSON(c))
                        )
                      );
                    } else {
                      newNodes.push(editor.schema.nodes.paragraph.create());
                    }
                  }
                });
                
                if (newNodes.length > 0) {
                  // 用新段落替换整个原段落
                  const slice = new Slice(Fragment.from(newNodes), 0, 0);
                  tr.replace(blockStart, blockEnd, slice);
                } else {
                  tr.removeMark(diffFrom, diffTo, diffMarkType);
                }
              } else {
                tr.removeMark(diffFrom, diffTo, diffMarkType);
              }
            } else {
              // 单段落：只替换 inline 内容
              const firstBlock = jsonContent.content[0];
              if (firstBlock.content) {
                // 将 JSONContent 转换成 ProseMirror Fragment
                const fragment = editor.schema.nodeFromJSON({
                  type: "doc",
                  content: [{ type: "paragraph", content: firstBlock.content }],
                }).content.firstChild?.content;

                if (fragment) {
                  tr.replaceWith(diffFrom, diffTo, fragment);
                } else {
                  tr.removeMark(diffFrom, diffTo, diffMarkType);
                }
              } else {
                tr.removeMark(diffFrom, diffTo, diffMarkType);
              }
            }
          } else {
            // 降级：直接移除 mark
            tr.removeMark(diffFrom, diffTo, diffMarkType);
          }

          // 4. 删除关联的 AIRewriteNode
          if (rewriteNodeType) {
            tr.doc.descendants((node, pos) => {
              if (node.type === rewriteNodeType && node.attrs.diffId === diffId) {
                tr.delete(pos, pos + node.nodeSize);
                return false;
              }
              return true;
            });
          }

          if (dispatch) dispatch(tr);
          return true;
        },
      /** 拒绝 AI Diff：删除新内容（AIDiffMark），保留原文（移除 AIPolishMark），删除 AIRewriteNode */
      rejectAIDiff:
        (diffId: string) =>
        ({ state, tr, dispatch }) => {
          const diffMarkType = state.schema.marks.aiDiff;
          const polishMarkType = state.schema.marks.aiPolishMark;
          const rewriteNodeType = state.schema.nodes.aiRewrite;
          if (!diffMarkType) return false;

          // 1. 找到并删除 diff 内容
          let diffFrom = -1;
          let diffTo = -1;

          state.doc.descendants((node, pos) => {
            if (!node.isText) return;
            const mark = node.marks.find(
              (m) => m.type === diffMarkType && m.attrs.diffId === diffId
            );
            if (mark) {
              if (diffFrom === -1) diffFrom = pos;
              diffTo = pos + node.nodeSize;
            }
          });

          if (diffFrom === -1 || diffTo === -1) return false;

          // 删除 diff 内容
          tr.delete(diffFrom, diffTo);

          // 2. 移除原文的 polish mark（支持跨行）
          if (polishMarkType) {
            const polishRanges: { from: number; to: number }[] = [];
            
            tr.doc.descendants((node, pos) => {
              if (!node.isText) return true;
              const mark = node.marks.find(
                (m) => m.type === polishMarkType && m.attrs.streaming === true
              );
              if (mark) {
                polishRanges.push({ from: pos, to: pos + node.nodeSize });
              }
              return true;
            });

            // 移除所有 polish mark
            for (const range of polishRanges) {
              tr.removeMark(range.from, range.to, polishMarkType);
            }
          }

          // 3. 删除关联的 AIRewriteNode
          if (rewriteNodeType) {
            tr.doc.descendants((node, pos) => {
              if (node.type === rewriteNodeType && node.attrs.diffId === diffId) {
                tr.delete(pos, pos + node.nodeSize);
                return false;
              }
              return true;
            });
          }

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

              // 在结束位置添加 Accept/Reject 按钮
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
