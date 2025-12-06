/**
 * AI Rewrite Node 扩展
 * 提供行内 AI 改写功能：输入提示词 → 流式生成 → 应用到正式内容
 */

import { Node, Mark, mergeAttributes, Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState, useCallback, useRef, useEffect, KeyboardEvent } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { gen } from "@common/lib/generator";

export interface AIRewriteOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiRewrite: {
      insertAIRewrite: () => ReturnType;
      insertAIPolish: () => ReturnType;
      removeAIRewrite: (id: string) => ReturnType;
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

export const AIRewriteNode = Node.create<AIRewriteOptions>({
  name: "aiRewrite",

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
        tag: 'div[data-type="ai-rewrite"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": "ai-rewrite" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ];
  },

  addCommands() {
    return {
      insertAIRewrite:
        () =>
        ({ commands }) => {
          const id = `ai-rewrite-${Date.now()}`;
          return commands.insertContent({
            type: this.name,
            attrs: { id, mode: "generate" },
          });
        },

      insertAIPolish:
        () =>
        ({ state, tr, dispatch }) => {
          const { from, to } = state.selection;
          if (from === to) return false; // 需要选中文字

          const markId = `ai-polish-mark-${Date.now()}`;
          const nodeId = `ai-polish-${Date.now()}`;

          // 1. 给选中文字添加 mark
          const markType = state.schema.marks.aiPolishMark;
          if (markType) {
            tr.addMark(from, to, markType.create({ id: markId }));
          }

          // 2. 找到选区所在块节点的结束位置，在其后插入润色节点
          const $to = state.doc.resolve(to);
          // 获取包含选区的最近的顶层 block 节点的结束位置
          let insertPos = $to.after($to.depth);

          // 确保不超出文档范围
          if (insertPos > state.doc.content.size) {
            insertPos = state.doc.content.size;
          }

          const nodeType = state.schema.nodes.aiRewrite;
          const newNode = nodeType.create({
            id: nodeId,
            mode: "polish",
            markId,
          });
          tr.insert(insertPos, newNode);

          if (dispatch) dispatch(tr);
          return true;
        },

      removeAIRewrite:
        (id: string) =>
        ({ state, tr }) => {
          let found = false;
          let markId: string | null = null;

          // 找到并删除 node
          state.doc.descendants((node, pos) => {
            if (node.type.name === "aiRewrite" && node.attrs.id === id) {
              markId = node.attrs.markId;
              tr.delete(pos, pos + node.nodeSize);
              found = true;
              return false;
            }
            return true;
          });

          // 如果有关联的 mark，移除它
          if (markId && found) {
            const markType = state.schema.marks.aiPolishMark;
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

          return found;
        },

      /** 开始流式编辑：保留原文（带删除线样式），在原文后插入 diff 内容 */
      startAIPolishStream:
        (nodeId: string) =>
        ({ state, tr, dispatch }) => {
          let targetPos: number | null = null;
          let nodeAttrs: any = null;

          state.doc.descendants((node, pos) => {
            if (node.type.name === "aiRewrite" && node.attrs.id === nodeId) {
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
          const polishMarkType = state.schema.marks.aiPolishMark;

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
          const nodeType = state.schema.nodes.aiRewrite;
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

          // 从 aiRewrite 节点获取信息
          let originalText = "";
          let polishMarkId = "";
          let insertPos = -1;
          let isCrossNode = false;

          state.doc.descendants((node) => {
            if (
              node.type.name === "aiRewrite" &&
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

          if (!polishMarkId || insertPos === -1) return false;

          if (isCrossNode) {
            // 跨节点：使用 AIDiffNode
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

            const diffMark = diffMarkType.create({ diffId, originalText });
            const textNode = state.schema.text(content, [diffMark]);

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
        return this.editor.commands.insertAIPolish();
      },
      "Mod-j": () => {
        // Cmd+J 与 Cmd+K 相同，触发润色模式
        return this.editor.commands.insertAIPolish();
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AIRewriteComponent);
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("aiRewriteFocus"),
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

            if (targetNode?.type?.name === "aiRewrite") {
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
 * AI Polish Mark 扩展
 * 用于标记正在被润色的原文
 */
export const AIPolishMark = Mark.create({
  name: "aiPolishMark",

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
    return [{ tag: 'span[data-type="ai-polish-mark"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const isStreaming = HTMLAttributes["data-streaming"] === "true";
    return [
      "span",
      mergeAttributes(
        {
          "data-type": "ai-polish-mark",
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

          // 删除关联的 aiRewrite 节点
          const nodeType = state.schema.nodes.aiRewrite;
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

// 辅助函数：从编辑器中获取带有指定 markId 的原文
function getMarkedText(editor: Editor, markId: string): string {
  const { state } = editor;
  const markType = state.schema.marks.aiPolishMark;
  if (!markType) return "";

  let text = "";
  state.doc.descendants((node) => {
    if (node.isText) {
      const mark = node.marks.find(
        (m) => m.type === markType && m.attrs.id === markId
      );
      if (mark) {
        text += node.text || "";
      }
    }
    return true;
  });
  return text;
}

function AIRewriteComponent(props: any) {
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isPolishMode = mode === "polish";

  // 自动聚焦
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 当节点被选中时，自动聚焦到输入框
  useEffect(() => {
    if (selected && status === "idle") {
      inputRef.current?.focus();
    }
  }, [selected, status]);

  // 发送请求：立即开始流式更新原文位置的 diff
  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || status === "loading") return;

    // 获取当前节点的 diffId（可能是从 undo/redo 恢复的）
    const currentDiffId = node.attrs.diffId;
    const nodeAttrs = editor.state.doc.nodeAt(props.getPos())?.attrs;

    // 如果已经有 diff，只清除 diff 内容，不删除 AIRewriteNode
    if (currentDiffId) {
      if (nodeAttrs?.isCrossNode) {
        // 跨节点：删除 AIDiffNode，保留原文
        const diffNodeType = editor.state.schema.nodes.aiDiffNode;
        const polishMarkType = editor.state.schema.marks.aiPolishMark;
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
        const polishMarkType = editor.state.schema.marks.aiPolishMark;
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
    setTimeout(() => inputRef.current?.focus(), 0);

    const requestId = `rewrite-${Date.now()}`;
    const channel = `docs:ai:stream:${requestId}`;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // 润色模式：获取原文
      const currentOriginalText =
        isPolishMode && markId ? getMarkedText(editor, markId) : "";

      // 1. 开始流式编辑：删除原文，创建 diff 状态
      if (isPolishMode && markId) {
        editor.commands.startAIPolishStream(nodeId);
      }

      // 获取更新后的 diffId
      const updatedDiffId = editor.state.doc.nodeAt(props.getPos())?.attrs
        .diffId;
      const savedOriginalText =
        editor.state.doc.nodeAt(props.getPos())?.attrs.originalText ||
        currentOriginalText;

      if (!updatedDiffId) {
        throw new Error("Failed to start stream edit");
      }

      // 构建系统消息
      const systemMessage = {
        role: "system",
        content: `你是一个专业的小说写作助手。请根据用户的润色需求，改写以下文字。

原文：
${savedOriginalText}

要求：
1. 直接输出润色后的内容，不要有任何前缀或解释
2. 保持原文的核心意思
3. 保持与上下文一致的风格和语气
4. 纯文本输出，不使用 Markdown 格式`,
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
      setStatus("completed");
      (window as any).electron?.ipcRenderer.removeAllListeners(channel);
    }
  }, [prompt, status, editor, isPolishMode, markId, nodeId, props, t, node]);

  // 取消：拒绝 diff 并关闭输入节点，光标移动到原文末尾
  const handleCancel = useCallback(() => {
    // 停止进行中的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 获取当前节点的 diffId（可能是从 undo/redo 恢复的）
    const currentDiffId = node.attrs.diffId;
    const currentMarkId = node.attrs.markId;

    // 找到原文的位置（用于定位光标）
    let originalTextEndPos = -1;
    const polishMarkType = editor.state.schema.marks.aiPolishMark;

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

    // 如果有 diff，拒绝它
    if (currentDiffId) {
      const nodeAttrs = editor.state.doc.nodeAt(props.getPos())?.attrs;
      if (nodeAttrs?.isCrossNode) {
        editor.commands.rejectAIDiffNode(currentDiffId);
      } else {
        editor.commands.rejectAIDiff(currentDiffId);
      }
    } else {
      // 没有 diff，直接移除节点
      if (isPolishMode && markId) {
        editor.commands.removeAIRewrite(nodeId);
      } else {
        deleteNode();
      }
    }

    // 将光标移动到原文末尾
    setTimeout(() => {
      const { state } = editor;
      // 找到最近的有效位置
      let targetPos = originalTextEndPos;
      if (targetPos === -1 || targetPos > state.doc.content.size) {
        // 找不到原文位置，尝试定位到 AIRewriteNode 原来的位置附近
        targetPos = Math.max(
          0,
          Math.min(props.getPos() || 0, state.doc.content.size)
        );
      }
      editor.commands.focus();
      editor.commands.setTextSelection(targetPos);
    }, 0);
  }, [deleteNode, editor, isPolishMode, markId, nodeId, props, node]);

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
          // 获取节点内容的文本长度
          diffTextLength = n.textContent.length;
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

    // 接受 diff（命令内部会删除 AIRewriteNode）
    if (isCrossNode) {
      editor.commands.acceptAIDiffNode(currentDiffId);
    } else {
      editor.commands.acceptAIDiff(currentDiffId);
    }

    // 将光标移动到新内容的末尾
    setTimeout(() => {
      const { state } = editor;
      // 接受后，新内容会在原文的位置，所以光标应该在 原文起始位置 + diff内容长度
      let targetPos =
        originalTextStartPos !== -1
          ? originalTextStartPos + diffTextLength
          : diffStartPos !== -1
            ? diffStartPos + diffTextLength
            : state.doc.content.size;

      // 确保不超出文档范围
      targetPos = Math.max(0, Math.min(targetPos, state.doc.content.size));

      editor.commands.focus();
      editor.commands.setTextSelection(targetPos);
    }, 0);
  }, [editor, deleteNode, props, node]);

  // 键盘事件
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Shift+Enter: 允许换行（不处理，让 textarea 默认行为）
      if (e.key === "Enter" && e.shiftKey) {
        // 不阻止默认行为，允许换行
        return;
      }

      // Cmd/Ctrl + Enter: 发送/重新生成
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        if (status !== "loading" && prompt.trim()) {
          handleSubmit();
        }
        return;
      }

      // Enter: 确认（有 diff 内容则接受，无任何内容则不响应）
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();

        const currentDiffId = node.attrs.diffId;

        // 有 diff 内容且不在生成中则接受（status 可能是 idle 因为 undo/redo 会重置状态）
        if (currentDiffId && status !== "loading" && !error) {
          handleAccept();
          return;
        }

        // 没有 input 内容且没有 diff 内容 → 不响应
        if (!prompt.trim() && !currentDiffId) {
          return;
        }

        // 有 input 但没有 diff（或有错误）→ 关闭节点
        deleteNode();
        return;
      }

      // Escape: 取消并关闭
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleCancel();
        return;
      }
    },
    [handleSubmit, handleAccept, handleCancel, status, prompt, error, node]
  );

  return (
    <NodeViewWrapper
      className="ai-rewrite-node my-2"
      data-type="ai-rewrite"
      data-id={nodeId}
    >
      <div className="rounded-md bg-muted-foreground/10 p-3 space-y-2">
        {/* 输入区域 */}
        <div className="flex items-start gap-2">
          <Sparkles className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isPolishMode
                  ? t("common.aiRewrite.polishPlaceholder", "输入润色指令...")
                  : t("common.aiRewrite.generatePlaceholder", "输入生成指令...")
              }
              className={cn(
                "w-full bg-transparent text-sm resize-none outline-none text-foreground",
                "placeholder:text-muted-foreground/50",
                "min-h-5 max-h-[100px]"
              )}
              rows={1}
            />
            {/* 提示文字 */}
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground/70">
              {status === "idle" && (
                <span>
                  {t(
                    "common.aiRewrite.idleHint",
                    "⌘+Enter 发送 · Enter/Esc 关闭"
                  )}
                </span>
              )}
              {status === "loading" && (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3 animate-spin" />
                  {t("common.aiRewrite.loadingHint", "生成中...")}
                </span>
              )}
              {status === "completed" && !error && (
                <span>
                  {t(
                    "common.aiRewrite.completedHint",
                    "Enter 确认 · ⌘+Enter 重新生成 · Esc 取消"
                  )}
                </span>
              )}
              {error && (
                <span className="text-destructive">
                  {error} ·{" "}
                  {t(
                    "common.aiRewrite.errorHint",
                    "⌘+Enter 重试 · Enter/Esc 关闭"
                  )}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-full transition-colors shrink-0"
            title={t("common.cancel", "取消 (Esc)")}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 错误提示 */}
        {error && <div className="text-xs text-destructive pl-6">{error}</div>}
      </div>
    </NodeViewWrapper>
  );
}
