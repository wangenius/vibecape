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
      updateAIPolishDiff: (diffId: string, content: string, originalText: string) => ReturnType;
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

      /** 开始流式编辑：删除原文，创建初始 AIDiffMark，更新节点属性 */
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
          const diffMarkType = state.schema.marks.aiDiff;

          if (!polishMarkType || !diffMarkType) return false;

          // 找到带有该 mark 的文本范围和原文
          let markFrom: number | null = null;
          let markTo: number | null = null;
          let originalText = "";

          state.doc.descendants((n, pos) => {
            if (n.isText) {
              const mark = n.marks.find(
                (m) => m.type === polishMarkType && m.attrs.id === markId
              );
              if (mark) {
                if (markFrom === null) markFrom = pos;
                markTo = pos + n.nodeSize;
                originalText += n.text || "";
              }
            }
            return true;
          });

          if (markFrom === null || markTo === null) return false;

          // 生成 diffId
          const diffId = gen.id({ prefix: "diff-", length: 12 });

          // 保存原文插入位置（删除前的位置）
          const insertPos = markFrom;

          // 1. 删除原文（带 polishMark 的内容）
          tr.delete(markFrom, markTo);

          // 2. 更新节点属性，保存 diffId、originalText 和 insertPos
          const nodeType = state.schema.nodes.aiRewrite;
          if (targetPos !== null) {
            // 注意：删除原文后，节点位置会前移
            const deletedLength = markTo - markFrom;
            const newNodePos = targetPos - deletedLength;
            tr.setNodeMarkup(newNodePos, nodeType, {
              ...nodeAttrs,
              diffId,
              originalText,
              insertPos, // 保存原文的插入位置
            });
          }

          if (dispatch) dispatch(tr);
          return true;
        },

      /** 流式更新 diff 内容 */
      updateAIPolishDiff:
        (diffId: string, content: string, originalText: string) =>
        ({ state, tr, dispatch }) => {
          const diffMarkType = state.schema.marks.aiDiff;
          if (!diffMarkType || !content) return false;

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
            // 首次插入：从节点属性获取插入位置
            let insertPos = -1;
            state.doc.descendants((node) => {
              if (
                node.type.name === "aiRewrite" &&
                node.attrs.diffId === diffId
              ) {
                insertPos = node.attrs.insertPos;
                return false;
              }
              return true;
            });

            if (insertPos === -1) return false;

            // 在原文位置插入 diff 内容
            tr.insert(insertPos, textNode);
          } else {
            // 更新现有内容
            tr.replaceWith(diffFrom, diffTo, textNode);
          }

          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-k": () => {
        // Cmd+K 触发润色模式（选中文本后插入输入节点）
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
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="ai-polish-mark"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        {
          "data-type": "ai-polish-mark",
          class:
            "relative underline decoration-primary/50 decoration-wavy decoration-from-font underline-offset-2",
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
  const diffId = node.attrs.diffId as string | null;

  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
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

    setStatus("loading");
    setError("");

    const requestId = `rewrite-${Date.now()}`;
    const channel = `docs:ai:stream:${requestId}`;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // 获取上下文
      const pos = editor.state.selection.from;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, pos - 500),
        pos,
        "\n"
      );

      // 润色模式：获取原文
      const currentOriginalText =
        isPolishMode && markId ? getMarkedText(editor, markId) : "";

      // 1. 开始流式编辑：删除原文，创建 diff 状态
      if (isPolishMode && markId) {
        editor.commands.startAIPolishStream(nodeId);
      }

      // 获取更新后的 diffId
      const updatedDiffId = editor.state.doc
        .nodeAt(props.getPos())?.attrs.diffId;
      const savedOriginalText = editor.state.doc
        .nodeAt(props.getPos())?.attrs.originalText || currentOriginalText;

      if (!updatedDiffId) {
        throw new Error("Failed to start stream edit");
      }

      // 构建系统消息
      const systemMessage = {
        role: "system",
        content: `你是一个专业的小说写作助手。请根据用户的润色需求，改写以下文字。

原文：
${savedOriginalText}

上下文：
${textBefore}

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
          setStatus("success");
        } else if (payload?.type === "error") {
          (window as any).electron?.ipcRenderer.removeAllListeners(channel);
          setError(payload.message || t("common.aiRewrite.failed"));
          setStatus("error");
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
      setStatus("error");
      (window as any).electron?.ipcRenderer.removeAllListeners(channel);
    }
  }, [prompt, status, editor, isPolishMode, markId, nodeId, props, t]);

  // 停止生成
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus("success");
  }, []);

  // 重新生成
  const handleRegenerate = useCallback(() => {
    // 先拒绝当前 diff，恢复原文
    if (diffId) {
      editor.commands.rejectAIDiff(diffId);
    }
    // 重新插入 polish mark
    // TODO: 需要重新添加 polishMark
    setStatus("idle");
  }, [editor, diffId]);

  // 取消/关闭
  const handleCancel = useCallback(() => {
    // 停止进行中的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // 如果有 diff，拒绝它
    if (diffId) {
      editor.commands.rejectAIDiff(diffId);
    }
    // 移除节点
    if (isPolishMode && markId) {
      editor.commands.removeAIRewrite(nodeId);
    } else {
      deleteNode();
    }
  }, [deleteNode, editor, isPolishMode, markId, nodeId, diffId]);

  // 完成：删除节点，保留 diff（用户通过 diff 的 Accept/Reject 按钮操作）
  const handleDone = useCallback(() => {
    deleteNode();
  }, [deleteNode]);

  // 键盘事件
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        if (status === "idle") {
          handleSubmit();
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleCancel();
        return;
      }
    },
    [handleSubmit, handleCancel, status]
  );

  return (
    <NodeViewWrapper
      className="ai-rewrite-node my-2"
      data-type="ai-rewrite"
      data-id={nodeId}
    >
      <div className="rounded-md bg-muted-foreground/10 p-3 space-y-2">
        {/* 输入区域 */}
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground shrink-0" />
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
            disabled={status === "loading"}
            className={cn(
              "flex-1 bg-transparent text-sm resize-none outline-none text-foreground",
              "placeholder:text-muted-foreground/50",
              "min-h-5 max-h-[100px]",
              status === "loading" && "opacity-50"
            )}
            rows={1}
          />
          {status === "loading" && (
            <Loader2 className="size-4 text-muted-foreground animate-spin shrink-0" />
          )}
          {/* 操作按钮 */}
          <div className="flex items-center gap-1.5">
            {status === "loading" && (
              <button
                onClick={handleStop}
                className="px-2 py-0.5 text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 rounded transition-colors"
              >
                {t("common.stop", "停止")}
              </button>
            )}
            {status === "success" && (
              <>
                <button
                  onClick={handleRegenerate}
                  className="px-2 py-0.5 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
                >
                  {t("common.regenerate", "重新生成")}
                </button>
                <button
                  onClick={handleDone}
                  className="px-2 py-0.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors"
                >
                  {t("common.done", "完成")}
                </button>
              </>
            )}
            {status === "error" && (
              <button
                onClick={handleRegenerate}
                className="px-2 py-0.5 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
              >
                {t("common.retry", "重试")}
              </button>
            )}
            <button
              onClick={handleCancel}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-full transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {status === "error" && (
          <div className="text-sm text-destructive">{error}</div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
