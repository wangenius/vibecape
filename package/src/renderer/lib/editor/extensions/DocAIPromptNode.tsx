/**
 * AI Rewrite Node 扩展
 * 提供行内 AI 改写功能：输入提示词 → 流式生成 → 应用到正式内容
 */

import { Node, Mark, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  useEditor,
  EditorContent,
  Extension,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { gen } from "@common/lib/generator";
import { PromptCommand } from "./PromptCommand";
import { PromptNode } from "./PromptNode";
import { createPromptPlugin } from "../menus/PromptMenu";
import { usePromptStore } from "@/hooks/stores/usePromptStore";

export interface DocAIPromptOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    docAIPrompt: {
      insertDocAIPrompt: () => ReturnType;
      insertDocAIPolish: () => ReturnType;
      removeDocAIPrompt: (id: string) => ReturnType;
      /** 开始 Generate 模式流式编辑 */
      startAIGenerateStream: (nodeId: string) => ReturnType;
      /** 开始流式编辑：删除原文，创建 AIDiffMark，更新节点属性 */
      startAIPolishStream: (nodeId: string) => ReturnType;
      /** 流式更新 diff 内容 */
      updateAIPolishDiff: (
        diffId: string,
        content: string,
        originalText: string
      ) => ReturnType;
    };
    aiPolishMark: {
      setPolishMark: (id: string) => ReturnType;
      unsetPolishMark: (id: string) => ReturnType;
    };
  }
}

export const DocAIPromptNode = Node.create<DocAIPromptOptions>({
  name: "docAIPrompt",

  group: "block",

  content: "",

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }
          return {
            "data-id": attributes.id,
          };
        },
      },
      mode: {
        default: "generate", // "generate" | "polish"
      },
      markId: {
        default: null, // 关联的 AIPolishMark id
      },
      diffId: {
        default: null, // 关联的 AIDiffMark id
      },
      originalText: {
        default: "", // 原文（用于 reject）
      },
      insertPos: {
        default: -1, // 原文插入位置（用于首次插入 diff）
      },
      isCrossNode: {
        default: false, // 是否跨节点（决定使用 DiffMark 还是 DiffNode）
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="doc-ai-prompt"]',
      },
      {
        tag: 'div[data-type="ai-rewrite"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": "doc-ai-prompt" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ];
  },

  addCommands() {
    return {
      insertDocAIPrompt:
        () =>
        ({ state, tr, dispatch }) => {
          const id = `ai-rewrite-${Date.now()}`;
          const { $from } = state.selection;
          const parent = $from.parent;

          // 如果当前段落是空的，替换整个段落而不是在其中插入
          if (parent.type.name === "paragraph" && parent.content.size === 0) {
            const start = $from.before($from.depth);
            const end = $from.after($from.depth);
            const nodeType = state.schema.nodes.docAIPrompt;
            const newNode = nodeType.create({ id, mode: "generate" });
            tr.replaceWith(start, end, newNode);
            if (dispatch) dispatch(tr);
            return true;
          }

          // 否则在当前位置插入
          const nodeType = state.schema.nodes.docAIPrompt;
          const newNode = nodeType.create({ id, mode: "generate" });
          tr.insert($from.pos, newNode);
          if (dispatch) dispatch(tr);
          return true;
        },

      insertDocAIPolish:
        () =>
        ({ state, tr, dispatch }) => {
          let { from, to } = state.selection;
          if (from === to) return false; // 需要选中文字

          // 调整选区范围，去除末尾的换行符/空白字符
          // 这样可以避免选区包含不可见的换行符导致插入位置错误
          const selectedText = state.doc.textBetween(from, to, "\n");
          const trimmedEnd = selectedText.replace(/[\s\n]+$/, "");
          if (!trimmedEnd) return false; // 选区只有空白字符
          
          // 计算实际的 to 位置（去除末尾空白后）
          const trimLength = selectedText.length - trimmedEnd.length;
          if (trimLength > 0) {
            to = to - trimLength;
          }

          const markId = `ai-polish-mark-${Date.now()}`;
          const nodeId = `ai-polish-${Date.now()}`;

          // 1. 给选中文字添加 mark
          const markType = state.schema.marks.docAIPolishMark;
          if (markType) {
            tr.addMark(from, to, markType.create({ id: markId }));
          }

          // 2. 找到选区所在块节点的结束位置，在其后插入润色节点
          const $to = state.doc.resolve(to);
          // 获取包含选区的最近的顶层 block 节点的结束位置
          // 使用 depth >= 1 确保不会尝试获取顶层文档节点之后的位置
          const depth = Math.max(1, $to.depth);
          let insertPos: number;
          try {
            insertPos = $to.after(depth);
          } catch {
            // 如果获取失败，使用文档末尾
            insertPos = state.doc.content.size;
          }

          // 确保不超出文档范围
          if (insertPos > state.doc.content.size) {
            insertPos = state.doc.content.size;
          }

          const nodeType = state.schema.nodes.docAIPrompt;
          const newNode = nodeType.create({
            id: nodeId,
            mode: "polish",
            markId,
          });
          tr.insert(insertPos, newNode);

          if (dispatch) dispatch(tr);
          return true;
        },

      removeDocAIPrompt:
        (id: string) =>
        ({ state, tr, dispatch }) => {
          let found = false;
          let markId: string | null = null;
          let nodePos: number | null = null;
          let nodeSize: number = 0;

          // 找到目标节点
          state.doc.descendants((node, pos) => {
            if (node.type.name === "docAIPrompt" && node.attrs.id === id) {
              markId = node.attrs.markId;
              nodePos = pos;
              nodeSize = node.nodeSize;
              found = true;
              return false;
            }
            return true;
          });

          if (!found || nodePos === null) return false;

          // 用空段落替换 DocAIPromptNode（转换为普通节点）
          const paragraph = state.schema.nodes.paragraph.create();
          tr.replaceWith(nodePos, nodePos + nodeSize, paragraph);

          // 如果有关联的 mark（polish 模式），移除它（波浪线）
          if (markId) {
            const markType = state.schema.marks.docAIPolishMark;
            if (markType) {
              tr.doc.descendants((node, pos) => {
                if (node.isText) {
                  const mark = node.marks.find(
                    (m) => m.type === markType && m.attrs.id === markId
                  );
                  if (mark) {
                    tr.removeMark(pos, pos + node.nodeSize, mark);
                  }
                }
                return true;
              });
            }
          }

          if (dispatch) dispatch(tr);
          return true;
        },

      /** 开始 Generate 模式流式编辑：在节点位置插入 DiffNode */
      startAIGenerateStream:
        (nodeId: string) =>
        ({ state, tr, dispatch }) => {
          let targetPos: number | null = null;
          let nodeAttrs: any = null;

          state.doc.descendants((node, pos) => {
            if (node.type.name === "docAIPrompt" && node.attrs.id === nodeId) {
              targetPos = pos;
              nodeAttrs = node.attrs;
              return false;
            }
            return true;
          });

          if (targetPos === null) {
            return false;
          }

          // 生成 diffId
          const diffId = gen.id({ prefix: "diff-", length: 12 });

          // 更新节点属性
          const nodeType = state.schema.nodes.docAIPrompt;
          tr.setNodeMarkup(targetPos, nodeType, {
            ...nodeAttrs,
            diffId,
            originalText: "", // generate 模式没有原文
            insertPos: targetPos, // 在节点位置插入
            isCrossNode: true, // 使用 DiffNode
          });

          if (dispatch) dispatch(tr);
          return true;
        },

      /** 开始流式编辑：保留原文（带删除线样式），在原文后插入 diff 内容 */
      startAIPolishStream:
        (nodeId: string) =>
        ({ state, tr, dispatch }) => {
          let targetPos: number | null = null;
          let nodeAttrs: any = null;

          state.doc.descendants((node, pos) => {
            if (node.type.name === "docAIPrompt" && node.attrs.id === nodeId) {
              targetPos = pos;
              nodeAttrs = node.attrs;
              return false;
            }
            return true;
          });

          if (targetPos === null || !nodeAttrs?.markId) {
            return false;
          }

          const markId = nodeAttrs.markId;
          const polishMarkType = state.schema.marks.docAIPolishMark;

          if (!polishMarkType) return false;

          // 找到带有该 mark 的文本范围（支持跨行）
          let markFrom: number | null = null;
          let markTo: number | null = null;
          const markedRanges: { from: number; to: number }[] = [];
          const blockNodes = new Set<number>(); // 记录包含 mark 的 block 节点

          state.doc.descendants((n, pos) => {
            if (n.isText) {
              const mark = n.marks.find(
                (m) => m.type === polishMarkType && m.attrs.id === markId
              );
              if (mark) {
                if (markFrom === null) markFrom = pos;
                markTo = pos + n.nodeSize;
                markedRanges.push({ from: pos, to: pos + n.nodeSize });
                // 记录所在的 block 节点
                const $pos = state.doc.resolve(pos);
                blockNodes.add($pos.before($pos.depth));
              }
            }
            return true;
          });

          if (markFrom === null || markTo === null || markedRanges.length === 0)
            return false;

          // 判断是否跨节点（多个 block 节点）
          const isCrossNode = blockNodes.size > 1;

          // 获取完整的原文（包括跨行的情况）
          const originalText = state.doc.textBetween(markFrom, markTo, "\n");

          // 生成 diffId
          const diffId = gen.id({ prefix: "diff-", length: 12 });

          // 保存插入位置（原文结束位置，新内容插入到原文后面）
          const insertPos = markTo;

          // 1. 更新原文的 AIPolishMark，设置 streaming: true（显示删除线）
          // 对每个带 mark 的范围分别更新（支持跨行）
          const newPolishMark = polishMarkType.create({
            id: markId,
            streaming: true,
          });
          for (const range of markedRanges) {
            tr.removeMark(range.from, range.to, polishMarkType);
            tr.addMark(range.from, range.to, newPolishMark);
          }

          // 2. 更新节点属性
          const nodeType = state.schema.nodes.docAIPrompt;
          if (targetPos !== null) {
            tr.setNodeMarkup(targetPos, nodeType, {
              ...nodeAttrs,
              diffId,
              originalText,
              insertPos, // 新内容插入位置（原文后面）
              isCrossNode, // 是否跨节点
            });
          }

          if (dispatch) dispatch(tr);
          return true;
        },

      /** 流式更新 diff 内容（根据是否跨节点选择 DiffMark 或 DiffNode） */
      updateAIPolishDiff:
        (diffId: string, content: string, _originalText: string) =>
        ({ state, tr, dispatch, editor }) => {
          if (!content) return false;

          // 从 docAIPrompt 节点获取信息
          let originalText = "";
          let polishMarkId = "";
          let insertPos = -1;
          let isCrossNode = false;

          state.doc.descendants((node) => {
            if (
              node.type.name === "docAIPrompt" &&
              node.attrs.diffId === diffId
            ) {
              originalText = node.attrs.originalText;
              polishMarkId = node.attrs.markId;
              insertPos = node.attrs.insertPos;
              isCrossNode = node.attrs.isCrossNode;
              return false;
            }
            return true;
          });

          // generate 模式没有 polishMarkId，但必须有 insertPos
          if (insertPos === -1) return false;

          if (isCrossNode) {
            // 跨节点或 generate 模式：使用 AIDiffNode
            const diffNodeType = state.schema.nodes.aiDiffNode;

            // 查找现有的 diff node
            let existingNode = false;
            state.doc.descendants((node) => {
              if (node.type === diffNodeType && node.attrs.diffId === diffId) {
                existingNode = true;
                return false;
              }
              return true;
            });

            if (existingNode) {
              return editor.commands.updateAIDiffNode(diffId, content);
            } else {
              return editor.commands.insertAIDiffNode({
                diffId,
                content,
                originalText,
                polishMarkId,
              });
            }
          } else {
            // 单节点：使用 AIDiffMark
            const diffMarkType = state.schema.marks.aiDiff;
            if (!diffMarkType) return false;

            // 查找现有的 diff mark
            let diffFrom = -1;
            let diffTo = -1;

            state.doc.descendants((node, pos) => {
              if (!node.isText) return;
              const mark = node.marks.find(
                (m) => m.type.name === "aiDiff" && m.attrs.diffId === diffId
              );
              if (mark) {
                if (diffFrom === -1) diffFrom = pos;
                diffTo = pos + node.nodeSize;
              }
            });

            // 创建 mark 时存储 rawContent（原始内容，包含 \n\n）
            const diffMark = diffMarkType.create({
              diffId,
              originalText,
              rawContent: content, // 保存原始内容用于 accept
            });
            // 显示时将连续换行符合并为单个换行符
            const displayContent = content.replace(/\n\n+/g, "\n");
            const textNode = state.schema.text(displayContent, [diffMark]);

            if (diffFrom === -1) {
              // 首次插入
              tr.insert(insertPos, textNode);
            } else {
              // 更新现有内容
              tr.replaceWith(diffFrom, diffTo, textNode);
            }

            if (dispatch) dispatch(tr);
            return true;
          }
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-k": () => {
        // Cmd+K 触发润色模式（选中文本后插入输入节点）
        return this.editor.commands.insertDocAIPolish();
      },
      "Mod-j": () => {
        // Cmd+J 与 Cmd+K 相同，触发润色模式
        return this.editor.commands.insertDocAIPolish();
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocAIPromptComponent);
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("docAIPromptFocus"),
        props: {
          handleKeyDown(view, event) {
            const { state } = view;
            const { selection } = state;
            const { $from } = selection;

            // 检查是否是上下键
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
              return false;
            }

            const isUp = event.key === "ArrowUp";

            // 找到光标所在的顶层块节点的深度
            const depth = $from.depth;
            if (depth < 1) return false;

            // 获取顶层块的位置（深度为1的父节点）
            const blockStart = $from.start(1);
            const blockEnd = $from.end(1);

            // 检查是否在块的边界
            // 上键：光标在块的第一行
            // 下键：光标在块的最后一行
            const textBefore = state.doc.textBetween(
              blockStart,
              $from.pos,
              "\n"
            );
            const textAfter = state.doc.textBetween($from.pos, blockEnd, "\n");
            const isAtFirstLine = !textBefore.includes("\n");
            const isAtLastLine = !textAfter.includes("\n");

            if ((isUp && !isAtFirstLine) || (!isUp && !isAtLastLine)) {
              return false;
            }

            // 查找相邻的块节点
            const $block = state.doc.resolve(blockStart);
            const blockIndex = $block.index(0);
            const parentNode = $block.node(0); // doc

            let targetNode: any = null;
            if (isUp && blockIndex > 0) {
              targetNode = parentNode.child(blockIndex - 1);
            } else if (!isUp && blockIndex < parentNode.childCount - 1) {
              targetNode = parentNode.child(blockIndex + 1);
            }

            if (targetNode?.type?.name === "docAIPrompt") {
              // 找到 AI 节点，聚焦其内部输入框
              event.preventDefault();

              setTimeout(() => {
                const nodeId = targetNode.attrs.id;
                const textarea = document.querySelector(
                  `[data-id="${nodeId}"] textarea`
                ) as HTMLTextAreaElement;
                textarea?.focus();
              }, 0);

              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

/**
 * DocAIPolish Mark 扩展
 * 用于标记正在被润色的原文
 */
export const DocAIPolishMark = Mark.create({
  name: "docAIPolishMark",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-polish-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { "data-polish-id": attributes.id };
        },
      },
      // streaming 状态：true 表示正在流式生成，原文应显示删除线
      streaming: {
        default: false,
        parseHTML: (element) =>
          element.getAttribute("data-streaming") === "true",
        renderHTML: (attributes) => {
          if (!attributes.streaming) return {};
          return { "data-streaming": "true" };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="docAIPolish-mark"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const isStreaming = HTMLAttributes["data-streaming"] === "true";
    return [
      "span",
      mergeAttributes(
        {
          "data-type": "docAIPolish-mark",
          class: isStreaming
            ? "ai-diff-deleted" // 流式生成时显示删除线
            : "relative underline decoration-primary/50 decoration-wavy decoration-from-font underline-offset-2",
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setPolishMark:
        (id: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { id });
        },
      unsetPolishMark:
        (id: string) =>
        ({ state, tr, dispatch }) => {
          const markType = state.schema.marks[this.name];
          if (!markType) return false;

          // 移除 mark
          state.doc.descendants((node, pos) => {
            if (node.isText) {
              const mark = node.marks.find(
                (m) => m.type === markType && m.attrs.id === id
              );
              if (mark) {
                tr.removeMark(pos, pos + node.nodeSize, mark);
              }
            }
            return true;
          });

          // 删除关联的 docAIPrompt 节点
          const nodeType = state.schema.nodes.docAIPrompt;
          if (nodeType) {
            const nodesToDelete: { pos: number; size: number }[] = [];
            tr.doc.descendants((node, pos) => {
              if (
                node.type === nodeType &&
                node.attrs.mode === "polish" &&
                node.attrs.markId === id
              ) {
                nodesToDelete.push({ pos, size: node.nodeSize });
              }
              return true;
            });
            // 从后往前删除
            nodesToDelete
              .sort((a, b) => b.pos - a.pos)
              .forEach(({ pos, size }) => {
                tr.delete(pos, pos + size);
              });
          }

          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },
});

function DocAIPromptComponent(props: any) {
  const { t } = useTranslation();
  const { node, editor, deleteNode, selected } = props;
  const nodeId = node.attrs.id as string;
  const mode = node.attrs.mode as "generate" | "polish";
  const markId = node.attrs.markId as string | null;
  // const diffId = node.attrs.diffId as string | null;

  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "completed">(
    "idle"
  );
  const [error, setError] = useState("");
  const promptRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const handleSubmitRef = useRef<() => void>(() => {});
  const handleAcceptRef = useRef<() => void>(() => {});
  const handleCancelRef = useRef<() => void>(() => {});
  const statusRef = useRef(status);
  const errorRef = useRef(error);
  const nodeRef = useRef(node);
  const miniEditorRef = useRef<ReturnType<typeof useEditor> | null>(null);

  const isPolishMode = mode === "polish";

  // 同步 refs
  useEffect(() => {
    promptRef.current = prompt;
  }, [prompt]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  useEffect(() => {
    nodeRef.current = node;
  }, [node]);

  // 发送请求：立即开始流式更新原文位置的 diff
  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || status === "loading") return;

    // 获取当前节点的 diffId（可能是从 undo/redo 恢复的）
    const currentDiffId = node.attrs.diffId;
    const nodeAttrs = editor.state.doc.nodeAt(props.getPos())?.attrs;

    // 如果已经有 diff，只清除 diff 内容，不删除 DocAIPromptNode
    if (currentDiffId) {
      if (nodeAttrs?.isCrossNode) {
        // 跨节点：删除 AIDiffNode，保留原文
        const diffNodeType = editor.state.schema.nodes.docAIPromptffNode;
        const polishMarkType = editor.state.schema.marks.docAIPolishMark;
        const { tr } = editor.state;

        // 删除 diff node
        editor.state.doc.descendants((n, pos) => {
          if (n.type === diffNodeType && n.attrs.diffId === currentDiffId) {
            tr.delete(pos, pos + n.nodeSize);
            return false;
          }
          return true;
        });

        // 移除 polish mark 的 streaming 状态
        if (polishMarkType) {
          tr.doc.descendants((n, pos) => {
            if (n.isText) {
              const mark = n.marks.find(
                (m) => m.type === polishMarkType && m.attrs.streaming === true
              );
              if (mark) {
                tr.removeMark(pos, pos + n.nodeSize, polishMarkType);
                tr.addMark(
                  pos,
                  pos + n.nodeSize,
                  polishMarkType.create({ id: mark.attrs.id, streaming: false })
                );
              }
            }
            return true;
          });
        }

        editor.view.dispatch(tr);
      } else {
        // 单节点：删除 AIDiffMark 内容，保留原文
        const diffMarkType = editor.state.schema.marks.aiDiff;
        const polishMarkType = editor.state.schema.marks.docAIPolishMark;
        const { tr } = editor.state;

        // 删除 diff 内容
        let diffFrom = -1;
        let diffTo = -1;
        editor.state.doc.descendants((n, pos) => {
          if (!n.isText) return;
          const mark = n.marks.find(
            (m) => m.type === diffMarkType && m.attrs.diffId === currentDiffId
          );
          if (mark) {
            if (diffFrom === -1) diffFrom = pos;
            diffTo = pos + n.nodeSize;
          }
        });

        if (diffFrom !== -1) {
          tr.delete(diffFrom, diffTo);
        }

        // 移除 polish mark 的 streaming 状态
        if (polishMarkType) {
          tr.doc.descendants((n, pos) => {
            if (n.isText) {
              const mark = n.marks.find(
                (m) => m.type === polishMarkType && m.attrs.streaming === true
              );
              if (mark) {
                tr.removeMark(pos, pos + n.nodeSize, polishMarkType);
                tr.addMark(
                  pos,
                  pos + n.nodeSize,
                  polishMarkType.create({ id: mark.attrs.id, streaming: false })
                );
              }
            }
            return true;
          });
        }

        editor.view.dispatch(tr);
      }
    }

    setStatus("loading");
    setError("");

    // 保持输入框聚焦
    setTimeout(() => {
      miniEditorRef.current?.commands.focus();
    }, 0);

    const requestId = `rewrite-${Date.now()}`;
    const channel = `docs:ai:stream:${requestId}`;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // 1. 开始流式编辑
      if (isPolishMode && markId) {
        // Polish 模式：获取原文并设置 streaming 状态
        editor.commands.startAIPolishStream(nodeId);
      } else {
        // Generate 模式：初始化 DiffNode
        editor.commands.startAIGenerateStream(nodeId);
      }

      // 获取更新后的 diffId
      const updatedDiffId = editor.state.doc.nodeAt(props.getPos())?.attrs
        .diffId;
      const savedOriginalText =
        editor.state.doc.nodeAt(props.getPos())?.attrs.originalText || "";

      if (!updatedDiffId) {
        throw new Error("Failed to start stream edit");
      }

      // 获取当前的 node 状态以判断是否支持 Markdown (AIDiffNode 支持 Markdown，AIDiffMark 不支持)
      const currentNode = editor.state.doc.nodeAt(props.getPos());
      const isCrossNode = currentNode?.attrs.isCrossNode;

      // 构建系统消息
      const systemMessage = isPolishMode
        ? {
            role: "system",
            content: `你是一个专业的小说写作助手。请根据用户的润色需求，改写以下文字。

原文：
${savedOriginalText}

要求：
1. 直接输出润色后的内容，不要有任何前缀或解释
2. 保持原文的核心意思
3. 保持与上下文一致的风格和语气
${
  !isCrossNode
    ? "4. 纯文本输出，不使用 Markdown 格式"
    : "4. 使用 Markdown 格式输出"
}`,
          }
        : {
            role: "system",
            content: `你是一个专业的小说写作助手。请根据用户的指令生成内容。

要求：
1. 直接输出生成的内容，不要有任何前缀或解释
2. 保持与上下文一致的风格和语气
3. 使用 Markdown 格式输出`,
          };

      let fullResponse = "";

      // 监听流式响应
      const handler = (_e: unknown, payload: any) => {
        if (abortController.signal.aborted) return;

        if (payload?.type === "text-delta") {
          fullResponse += payload.text || "";
          // 流式更新 diff 内容
          editor.commands.updateAIPolishDiff(
            updatedDiffId,
            fullResponse,
            savedOriginalText
          );
        } else if (payload?.type === "end") {
          (window as any).electron?.ipcRenderer.removeAllListeners(channel);
          // 完成流式更新，显示 Accept/Reject 按钮
          const nodeAttrs = editor.state.doc.nodeAt(props.getPos())?.attrs;
          if (nodeAttrs?.isCrossNode) {
            editor.commands.finishAIDiffNode(updatedDiffId);
          }
          setStatus("completed");
          setError("");
        } else if (payload?.type === "error") {
          (window as any).electron?.ipcRenderer.removeAllListeners(channel);
          setError(payload.message || t("common.aiRewrite.failed"));
          setStatus("completed");
        }
      };

      (window as any).electron?.ipcRenderer.on(channel, handler);

      // 使用 docs:ai:generate API
      const docsAI = (window as any).api?.docs?.ai;
      if (!docsAI?.generate) {
        throw new Error(t("common.aiRewrite.apiNotEnabled"));
      }

      await docsAI.generate({
        id: requestId,
        prompt: prompt.trim(),
        messages: [systemMessage],
      });
    } catch (err) {
      console.error("AI 改写失败:", err);
      setError(
        err instanceof Error ? err.message : t("common.aiRewrite.unknownError")
      );
      setStatus("idle");
      (window as any).electron?.ipcRenderer.removeAllListeners(channel);
    }
  }, [prompt, status, editor, isPolishMode, markId, nodeId, props, t, node]);

  // 取消：拒绝 diff 并关闭输入节点，将 PromptNode 转换为普通段落
  const handleCancel = useCallback(() => {
    // 停止进行中的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 获取当前节点的 diffId（可能是从 undo/redo 恢复的）
    const currentDiffId = node.attrs.diffId;
    const currentMarkId = node.attrs.markId;

    // 记录当前节点位置，用于转换后定位光标
    const currentNodePos = props.getPos();

    // 如果有 diff，拒绝它（这会删除 diff 内容和 PromptNode）
    if (currentDiffId) {
      const nodeAttrs = editor.state.doc.nodeAt(props.getPos())?.attrs;
      if (nodeAttrs?.isCrossNode) {
        editor.commands.rejectAIDiffNode(currentDiffId);
      } else {
        editor.commands.rejectAIDiff(currentDiffId);
      }
      
      // polish 模式：光标移动到原文末尾
      setTimeout(() => {
        let originalTextEndPos = -1;
        const polishMarkType = editor.state.schema.marks.docAIPolishMark;
        if (polishMarkType && currentMarkId) {
          editor.state.doc.descendants((n, pos) => {
            if (n.isText) {
              const mark = n.marks.find(
                (m) => m.type === polishMarkType && m.attrs.id === currentMarkId
              );
              if (mark) {
                originalTextEndPos = pos + n.nodeSize;
              }
            }
            return true;
          });
        }
        
        if (originalTextEndPos !== -1) {
          editor.commands.focus(originalTextEndPos);
        } else {
          editor.commands.focus();
        }
      }, 0);
    } else {
      // 没有 diff（generate 模式）：将 PromptNode 转换为普通段落
      editor.commands.removeDocAIPrompt(nodeId);

      // 将光标移动到新创建的段落中
      setTimeout(() => {
        // removeDocAIPrompt 将节点替换为空段落，段落内部位置是 currentNodePos + 1
        const targetPos = (currentNodePos || 0) + 1;
        
        try {
          const { state } = editor;
          // 确保位置有效
          const safePos = Math.max(1, Math.min(targetPos, state.doc.content.size));
          editor.commands.focus(safePos);
        } catch (e) {
          // 如果失败，尝试聚焦到文档
          editor.commands.focus();
        }
      }, 0);
    }
  }, [editor, nodeId, props, node]);

  // 接受 diff 并关闭输入节点，光标移动到新内容的末尾
  const handleAccept = useCallback(() => {
    // 获取当前节点的 diffId（可能是从 undo/redo 恢复的）
    const currentDiffId = node.attrs.diffId;
    if (!currentDiffId) {
      deleteNode();
      return;
    }

    // 获取节点属性
    const nodeAttrs = editor.state.doc.nodeAt(props.getPos())?.attrs;
    const isCrossNode = nodeAttrs?.isCrossNode;

    // 获取 diff 内容的文本长度（用于计算接受后的光标位置）
    let diffTextLength = 0;
    let diffStartPos = -1;

    if (isCrossNode) {
      // 跨节点：查找 AIDiffNode
      const diffNodeType = editor.state.schema.nodes.aiDiffNode;
      editor.state.doc.descendants((n, pos) => {
        if (n.type === diffNodeType && n.attrs.diffId === currentDiffId) {
          diffStartPos = pos;
          // 获取节点内容的实际大小（包含标记）
          diffTextLength = n.content.size;
          return false;
        }
        return true;
      });
    } else {
      // 单节点：查找 AIDiffMark
      const diffMarkType = editor.state.schema.marks.aiDiff;
      editor.state.doc.descendants((n, pos) => {
        if (!n.isText) return;
        const mark = n.marks.find(
          (m) => m.type === diffMarkType && m.attrs.diffId === currentDiffId
        );
        if (mark) {
          if (diffStartPos === -1) diffStartPos = pos;
          diffTextLength += n.nodeSize;
        }
      });
    }

    // 找到原文的起始位置（用于计算接受后光标应该在的位置）
    let originalTextStartPos = -1;
    const polishMarkType = editor.state.schema.marks.aiPolishMark;
    const currentMarkId = node.attrs.markId;

    if (polishMarkType && currentMarkId) {
      editor.state.doc.descendants((n, pos) => {
        if (n.isText) {
          const mark = n.marks.find(
            (m) => m.type === polishMarkType && m.attrs.id === currentMarkId
          );
          if (mark && originalTextStartPos === -1) {
            originalTextStartPos = pos;
            return false;
          }
        }
        return true;
      });
    }

    // 接受 diff（命令内部会删除 DocAIPromptNode 并设置光标位置）
    if (isCrossNode) {
      editor.commands.acceptAIDiffNode(currentDiffId);
    } else {
      editor.commands.acceptAIDiff(currentDiffId);
    }

    // 确保焦点回到主编辑器
    editor.commands.focus();
  }, [editor, deleteNode, props, node]);

  // 同步 refs
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  useEffect(() => {
    handleAcceptRef.current = handleAccept;
  }, [handleAccept]);

  useEffect(() => {
    handleCancelRef.current = handleCancel;
  }, [handleCancel]);

  // Mini TipTap Editor 用于输入提示词
  const placeholderText = isPolishMode
    ? t("common.aiRewrite.polishPlaceholder", "输入润色指令...")
    : t("common.aiRewrite.generatePlaceholder", "输入生成指令...");

  // 创建 Prompt 插件配置
  const promptSuggestion = useMemo(() => createPromptPlugin(t), [t]);

  const miniEditor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: false,
          codeBlock: false,
          blockquote: false,
          bulletList: false,
          orderedList: false,
          horizontalRule: false,
        }),
        Placeholder.configure({
          placeholder: placeholderText,
          emptyEditorClass: "is-editor-empty",
        }),
        PromptNode,
        PromptCommand.configure({
          suggestion: promptSuggestion,
        }),
        Extension.create({
          name: "docAIPromptInputKeymap",
          addKeyboardShortcuts() {
            return {
              // Cmd/Ctrl + A: 全选当前 mini editor 内容，阻止冒泡到主编辑器
              "Mod-a": ({ editor: e }) => {
                e.commands.selectAll();
                return true;
              },
              // Cmd/Ctrl + Enter: 发送/重新生成
              "Mod-Enter": () => {
                const currentPrompt = promptRef.current;
                if (statusRef.current !== "loading" && currentPrompt.trim()) {
                  handleSubmitRef.current();
                }
                return true;
              },
              // Shift + Enter: 接受应用（仅在有生成内容时）
              "Shift-Enter": () => {
                if (statusRef.current === "completed") {
                  handleAcceptRef.current();
                }
                return true;
              },
              // Backspace: 空内容时关闭节点
              Backspace: ({ editor: e }) => {
                const currentPrompt = promptRef.current;
                // 只有在内容为空时才关闭
                if (!currentPrompt.trim() && e.state.doc.textContent.trim() === "") {
                  handleCancelRef.current();
                  return true;
                }
                return false;
              },
              // Shift + Backspace: 没有内容时关闭
              "Shift-Backspace": () => {
                const currentPrompt = promptRef.current;
                if (!currentPrompt.trim()) {
                  handleCancelRef.current();
                  return true;
                }
                return false;
              },
              // Mod + Backspace: 没有内容时关闭
              "Mod-Backspace": () => {
                const currentPrompt = promptRef.current;
                if (!currentPrompt.trim()) {
                  handleCancelRef.current();
                  return true;
                }
                return false;
              },
              // Enter: 空内容时关闭节点，有内容时使用默认行为
              Enter: ({ editor: e }) => {
                const currentPrompt = promptRef.current;
                // 只有在内容为空时才关闭
                if (!currentPrompt.trim() && e.state.doc.textContent.trim() === "") {
                  handleCancelRef.current();
                  return true;
                }
                return false;
              },
              // Escape: 取消并关闭
              Escape: () => {
                handleCancelRef.current();
                return true;
              },
            };
          },
        }),
      ],
      editorProps: {
        attributes: {
          class: "ai-rewrite-input-editor",
        },
      },
      onUpdate: ({ editor: e }) => {
        // 遍历文档，将 PromptNode 转换为实际的 prompt 文本
        const extractPromptText = () => {
          let text = "";
          e.state.doc.descendants((node) => {
            if (node.type.name === "promptNode") {
              // 获取 prompt 的实际文本内容
              const promptText = usePromptStore
                .getState()
                .getPromptText(node.attrs.id);
              text += promptText || "";
            } else if (node.isText) {
              text += node.text || "";
            } else if (node.type.name === "paragraph" && text.length > 0) {
              text += "\n";
            }
            return true;
          });
          return text.trim();
        };
        setPrompt(extractPromptText());
      },
    },
    [placeholderText, promptSuggestion]
  );

  // 同步 miniEditor ref
  useEffect(() => {
    miniEditorRef.current = miniEditor;
  }, [miniEditor]);

  // 自动聚焦
  useEffect(() => {
    const timer = setTimeout(() => {
      miniEditor?.commands.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [miniEditor]);

  // 当节点被选中时，自动聚焦到输入框
  useEffect(() => {
    if (selected && status === "idle") {
      miniEditor?.commands.focus();
    }
  }, [selected, status, miniEditor]);

  return (
    <NodeViewWrapper
      className="ai-rewrite-node my-2"
      data-type="ai-rewrite"
      data-id={nodeId}
    >
      <div className="rounded-md bg-muted-foreground/10 p-3 space-y-2">
        {/* 输入区域 */}
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <EditorContent
              editor={miniEditor}
              className={cn(
                "w-full bg-transparent text-sm text-foreground",
                "[&_.ProseMirror]:outline-none [&_.ProseMirror]:max-h-[9em] [&_.ProseMirror]:overflow-y-auto [&_.ProseMirror]:min-h-0!",
                "[&_.ProseMirror_p]:m-0 [&_.ProseMirror_p]:leading-normal",
                "[&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:text-muted-foreground/50 [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:h-0 [&_.is-editor-empty]:before:pointer-events-none"
              )}
            />
          </div>
          {/* 提示文字 */}
          <div className="text-xs text-muted-foreground/50 shrink-0">
            {status === "idle" && t("common.aiRewrite.idleHint", "⌘↵ 发送")}
            {status === "loading" && (
              <span className="flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
              </span>
            )}
            {status === "completed" &&
              !error &&
              t("common.aiRewrite.completedHint", "⇧↵ 应用")}
            {error && (
              <span className="text-destructive">
                {t("common.aiRewrite.errorHint", "⌘↵ 重试")}
              </span>
            )}
          </div>
        </div>

        {/* 错误提示 */}
        {error && <div className="text-xs text-destructive pl-6">{error}</div>}
      </div>
    </NodeViewWrapper>
  );
}
