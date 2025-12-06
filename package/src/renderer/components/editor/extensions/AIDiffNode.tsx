/**
 * AI Diff Node Extension
 *
 * 用于显示 AI 生成的 diff 内容，支持跨行跨节点
 * - 独立的 block node，包含完整的 AI 生成内容
 * - 内部渲染 markdown 转换后的节点
 * - Accept: 删除原文，用 node 内容替换
 * - Reject: 删除 node，保留原文
 */

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Slice } from "@tiptap/pm/model";
import { markdownToJSON } from "@common/lib/content-converter";
import { Check, X } from "lucide-react";

export interface AIDiffNodeOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiDiffNode: {
      /** 插入 AI Diff 节点 */
      insertAIDiffNode: (attrs: {
        diffId: string;
        content: string;
        originalText: string;
        polishMarkId: string;
      }) => ReturnType;
      /** 更新 AI Diff 节点内容（流式） */
      updateAIDiffNode: (diffId: string, content: string) => ReturnType;
      /** 完成流式更新 */
      finishAIDiffNode: (diffId: string) => ReturnType;
      /** 接受 AI Diff：删除原文，用节点内容替换 */
      acceptAIDiffNode: (diffId: string) => ReturnType;
      /** 拒绝 AI Diff：删除节点，保留原文 */
      rejectAIDiffNode: (diffId: string) => ReturnType;
    };
  }
}

export const AIDiffNode = Node.create<AIDiffNodeOptions>({
  name: "aiDiffNode",

  group: "block",

  atom: false, // 允许内部有内容

  content: "block+", // 可以包含多个 block 节点

  defining: true,

  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      diffId: {
        default: null,
      },
      // 原始 markdown 内容（用于流式更新）
      rawContent: {
        default: "",
      },
      // 原文（用于 reject 时恢复）
      originalText: {
        default: "",
      },
      // 关联的 polish mark id
      polishMarkId: {
        default: null,
      },
      // 是否正在流式生成
      streaming: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="ai-diff-node"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        {
          "data-type": "ai-diff-node",
          class: "ai-diff-node text-green-600 dark:text-green-400",
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AIDiffNodeComponent);
  },

  addCommands() {
    return {
      /** 插入 AI Diff 节点 */
      insertAIDiffNode:
        ({ diffId, content, originalText, polishMarkId }) =>
        ({ state, tr, dispatch, editor }) => {
          const nodeType = state.schema.nodes.aiDiffNode;
          if (!nodeType) return false;

          // 找到 polish mark 的结束位置，在其后插入
          const polishMarkType = state.schema.marks.aiPolishMark;
          let insertPos = -1;
          let lastMarkPos = -1;

          if (polishMarkType && polishMarkId) {
            state.doc.descendants((node, pos) => {
              if (node.isText) {
                const mark = node.marks.find(
                  (m) => m.type === polishMarkType && m.attrs.id === polishMarkId
                );
                if (mark) {
                  // 记录最后一个带 mark 的位置
                  lastMarkPos = pos + node.nodeSize;
                }
              }
              return true;
            });

            if (lastMarkPos !== -1) {
              // 找到包含这个位置的 block 节点的结束位置
              const $pos = state.doc.resolve(lastMarkPos);
              // 确保 depth 至少为 1，避免访问顶层节点之后的位置
              const depth = Math.max(1, $pos.depth);
              insertPos = $pos.after(depth);
            }
          }

          if (insertPos === -1) return false;

          // 将 markdown 转换成节点内容
          const jsonContent = markdownToJSON(content || " ");
          const innerContent = jsonContent.content || [
            { type: "paragraph", content: [{ type: "text", text: " " }] },
          ];

          // 创建节点
          const diffNode = nodeType.create(
            {
              diffId,
              rawContent: content,
              originalText,
              polishMarkId,
              streaming: true,
            },
            innerContent.map((block) => editor.schema.nodeFromJSON(block))
          );

          tr.insert(insertPos, diffNode);

          if (dispatch) dispatch(tr);
          return true;
        },

      /** 更新 AI Diff 节点内容（流式） */
      updateAIDiffNode:
        (diffId: string, content: string) =>
        ({ state, tr, dispatch, editor }) => {
          const nodeType = state.schema.nodes.aiDiffNode;
          if (!nodeType || !content) return false;

          let nodePos = -1;
          let nodeSize = 0;

          state.doc.descendants((node, pos) => {
            if (node.type === nodeType && node.attrs.diffId === diffId) {
              nodePos = pos;
              nodeSize = node.nodeSize;
              return false;
            }
            return true;
          });

          if (nodePos === -1) return false;

          // 将 markdown 转换成节点内容
          const jsonContent = markdownToJSON(content);
          const innerContent = jsonContent.content || [
            { type: "paragraph", content: [{ type: "text", text: content }] },
          ];

          // 创建新节点替换旧节点
          const currentNode = state.doc.nodeAt(nodePos);
          if (!currentNode) return false;

          const newNode = nodeType.create(
            {
              ...currentNode.attrs,
              rawContent: content,
            },
            innerContent.map((block) => editor.schema.nodeFromJSON(block))
          );

          tr.replaceWith(nodePos, nodePos + nodeSize, newNode);

          if (dispatch) dispatch(tr);
          return true;
        },

      /** 完成流式更新：设置 streaming 为 false */
      finishAIDiffNode:
        (diffId: string) =>
        ({ state, tr, dispatch }) => {
          const nodeType = state.schema.nodes.aiDiffNode;
          if (!nodeType) return false;

          let nodePos = -1;
          let nodeSize = 0;

          state.doc.descendants((node, pos) => {
            if (node.type === nodeType && node.attrs.diffId === diffId) {
              nodePos = pos;
              nodeSize = node.nodeSize;
              return false;
            }
            return true;
          });

          if (nodePos === -1) return false;

          const currentNode = state.doc.nodeAt(nodePos);
          if (!currentNode) return false;

          // 创建新节点，设置 streaming 为 false
          const newNode = nodeType.create(
            {
              ...currentNode.attrs,
              streaming: false,
            },
            currentNode.content
          );

          tr.replaceWith(nodePos, nodePos + nodeSize, newNode);

          if (dispatch) dispatch(tr);
          return true;
        },

      /** 接受 AI Diff：删除原文，用节点内容替换，删除 AIRewriteNode */
      acceptAIDiffNode:
        (diffId: string) =>
        ({ state, tr, dispatch }) => {
          const nodeType = state.schema.nodes.aiDiffNode;
          const polishMarkType = state.schema.marks.aiPolishMark;
          const rewriteNodeType = state.schema.nodes.aiRewrite;
          if (!nodeType) return false;

          // 1. 找到 diff node
          let nodePos = -1;
          let polishMarkId = "";

          state.doc.descendants((node, pos) => {
            if (node.type === nodeType && node.attrs.diffId === diffId) {
              nodePos = pos;
              polishMarkId = node.attrs.polishMarkId;
              return false;
            }
            return true;
          });

          if (nodePos === -1) return false;

          // 2. 找到并删除原文（带 polish mark 的内容）
          // 收集需要删除的 block 节点（如果整个 block 只包含被标记的文本）
          if (polishMarkType && polishMarkId) {
            const blocksToDelete: { from: number; to: number }[] = [];
            const processedBlocks = new Set<number>();

            state.doc.descendants((node, pos) => {
              if (node.isText) {
                const mark = node.marks.find(
                  (m) => m.type === polishMarkType && m.attrs.id === polishMarkId
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
                            (m) => m.type === polishMarkType && m.attrs.id === polishMarkId
                          );
                          if (!hasMark) {
                            allMarked = false;
                          }
                        }
                        return true;
                      });

                      if (allMarked) {
                        // 整个 block 都是被标记的，删除整个 block
                        blocksToDelete.push({
                          from: blockStart,
                          to: blockStart + blockNode.nodeSize,
                        });
                      }
                    }
                  }
                }
              }
              return true;
            });

            // 如果有整个 block 需要删除，从后往前删除
            if (blocksToDelete.length > 0) {
              blocksToDelete.sort((a, b) => b.from - a.from);
              for (const block of blocksToDelete) {
                tr.delete(block.from, block.to);
              }
            } else {
              // 否则只删除文本内容
              const polishRanges: { from: number; to: number }[] = [];
              state.doc.descendants((node, pos) => {
                if (node.isText) {
                  const mark = node.marks.find(
                    (m) => m.type === polishMarkType && m.attrs.id === polishMarkId
                  );
                  if (mark) {
                    polishRanges.push({ from: pos, to: pos + node.nodeSize });
                  }
                }
                return true;
              });

              for (let i = polishRanges.length - 1; i >= 0; i--) {
                const range = polishRanges[i];
                tr.delete(range.from, range.to);
              }
            }
          }

          // 3. 删除 diff node，保留其内容
          // 重新查找节点位置（因为删除原文后位置可能变化）
          let newNodePos = -1;
          let newNodeSize = 0;

          tr.doc.descendants((node, pos) => {
            if (node.type === nodeType && node.attrs.diffId === diffId) {
              newNodePos = pos;
              newNodeSize = node.nodeSize;
              return false;
            }
            return true;
          });

          if (newNodePos !== -1) {
            // 获取节点内容并替换节点
            const diffNode = tr.doc.nodeAt(newNodePos);
            if (diffNode && diffNode.content.size > 0) {
              // 使用 Slice 来确保所有子节点都被正确保留
              // openStart 和 openEnd 都是 0，表示完整的块级内容
              const slice = new Slice(diffNode.content, 0, 0);
              tr.replace(newNodePos, newNodePos + newNodeSize, slice);
            }
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

      /** 拒绝 AI Diff：删除节点，保留原文，删除 AIRewriteNode */
      rejectAIDiffNode:
        (diffId: string) =>
        ({ state, tr, dispatch }) => {
          const nodeType = state.schema.nodes.aiDiffNode;
          const polishMarkType = state.schema.marks.aiPolishMark;
          const rewriteNodeType = state.schema.nodes.aiRewrite;
          if (!nodeType) return false;

          // 1. 找到并删除 diff node
          let nodePos = -1;
          let nodeSize = 0;
          let polishMarkId = "";

          state.doc.descendants((node, pos) => {
            if (node.type === nodeType && node.attrs.diffId === diffId) {
              nodePos = pos;
              nodeSize = node.nodeSize;
              polishMarkId = node.attrs.polishMarkId;
              return false;
            }
            return true;
          });

          if (nodePos === -1) return false;

          // 删除 diff node
          tr.delete(nodePos, nodePos + nodeSize);

          // 2. 移除原文的 polish mark
          if (polishMarkType && polishMarkId) {
            tr.doc.descendants((node, pos) => {
              if (node.isText) {
                const mark = node.marks.find(
                  (m) => m.type === polishMarkType && m.attrs.id === polishMarkId
                );
                if (mark) {
                  tr.removeMark(pos, pos + node.nodeSize, mark);
                }
              }
              return true;
            });
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
});

/**
 * AI Diff Node 组件
 */
function AIDiffNodeComponent({ node, editor }: { node: any; editor: any }) {
  const { diffId, streaming } = node.attrs;

  const handleAccept = () => {
    editor.commands.acceptAIDiffNode(diffId);
  };

  const handleReject = () => {
    editor.commands.rejectAIDiffNode(diffId);
  };

  return (
    <NodeViewWrapper
      className="ai-diff-node-wrapper"
      data-type="ai-diff-node"
      data-diff-id={diffId}
    >
      <div className="relative">
        {/* 内容区域 */}
        <div data-node-view-content="" />

        {/* 操作按钮 */}
        {!streaming && (
          <span className="inline-flex items-center gap-0.5 ml-1 align-middle">
            <button
              onClick={handleAccept}
              className="text-green-600 hover:text-green-700"
              title="Accept"
            >
              <Check className="size-3.5" />
            </button>
            <button
              onClick={handleReject}
              className="text-red-500 hover:text-red-600"
              title="Reject"
            >
              <X className="size-3.5" />
            </button>
          </span>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export default AIDiffNode;
