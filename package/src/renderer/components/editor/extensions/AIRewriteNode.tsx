/**
 * AI Rewrite Node 扩展
 * 提供行内 AI 改写功能：输入提示词 → 流式生成 → 应用到正式内容
 */

import { Node, Mark, mergeAttributes, Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Fragment } from "@tiptap/pm/model";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState, useCallback, useRef, useEffect, KeyboardEvent } from "react";
import { Loader2, Sparkles, X, Check, BrainIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export interface AIRewriteOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiRewrite: {
      insertAIRewrite: () => ReturnType;
      insertAIPolish: () => ReturnType;
      removeAIRewrite: (id: string) => ReturnType;
      applyAIRewrite: (id: string, content: string) => ReturnType;
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
        default: null, // 关联的 mark id（润色模式）
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

          // 2. 在选中文字后面插入润色节点
          const nodeType = state.schema.nodes.aiRewrite;
          const newNode = nodeType.create({
            id: nodeId,
            mode: "polish",
            markId,
          });
          tr.insert(to, newNode);

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

      applyAIRewrite:
        (id: string, content: string) =>
        ({ state, tr }) => {
          let targetPos: number | null = null;
          let nodeAttrs: any = null;

          state.doc.descendants((node, pos) => {
            if (node.type.name === "aiRewrite" && node.attrs.id === id) {
              targetPos = pos;
              nodeAttrs = node.attrs;
              return false;
            }
            return true;
          });

          if (targetPos !== null && nodeAttrs) {
            const node = state.doc.nodeAt(targetPos);
            if (node) {
              // 将内容按换行分割成多个段落，过滤空行
              const paragraphs = content.split(/\n+/).filter((p) => p.trim());
              const paragraphNodes = paragraphs.map((text) =>
                state.schema.nodes.paragraph.create(
                  null,
                  state.schema.text(text.trim())
                )
              );

              // 使用 Fragment 一次性插入
              const fragment = Fragment.from(paragraphNodes);

              // 删除 AI 节点
              tr.delete(targetPos, targetPos + node.nodeSize);

              // 润色模式：替换带 mark 的原文
              if (nodeAttrs.mode === "polish" && nodeAttrs.markId) {
                const markId = nodeAttrs.markId;
                const markType = state.schema.marks.aiPolishMark;

                // 找到带有该 mark 的文本范围
                let markFrom: number | null = null;
                let markTo: number | null = null;

                tr.doc.descendants((n, pos) => {
                  if (n.isText) {
                    const mark = n.marks.find(
                      (m) => m.type === markType && m.attrs.id === markId
                    );
                    if (mark) {
                      if (markFrom === null) markFrom = pos;
                      markTo = pos + n.nodeSize;
                    }
                  }
                  return true;
                });

                if (markFrom !== null && markTo !== null) {
                  tr.replaceWith(markFrom, markTo, fragment);
                }
              } else {
                // 生成模式：在当前位置插入
                tr.insert(targetPos, fragment);
              }
              return true;
            }
          }

          return false;
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

  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const reasoningStartTime = useRef<number | null>(null);

  const isPolishMode = mode === "polish";

  // 自动聚焦 - 延迟确保 DOM 已渲染
  useEffect(() => {
    // 使用 setTimeout 确保在渲染后聚焦
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 当节点被选中时（通过上下键导航进入），自动聚焦到输入框
  useEffect(() => {
    if (selected) {
      inputRef.current?.focus();
    }
  }, [selected]);

  // 发送请求
  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || status === "loading") return;

    setStatus("loading");
    setResponse("");
    setReasoning("");
    setError("");
    reasoningStartTime.current = Date.now();

    const requestId = `rewrite-${Date.now()}`;
    const channel = `docs:ai:stream:${requestId}`;

    try {
      // 获取当前光标位置之前的上下文
      const pos = editor.state.selection.from;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, pos - 500),
        pos,
        "\n"
      );

      // 润色模式：实时从 mark 中获取原文
      const currentOriginalText =
        isPolishMode && markId ? getMarkedText(editor, markId) : "";

      // 根据模式构建系统消息
      const systemMessage = {
        role: "system",
        content: isPolishMode
          ? `你是一个专业的小说写作助手。请根据用户的润色需求，改写以下文字。

原文：
${currentOriginalText}

上下文：
${textBefore}

要求：
1. 直接输出润色后的内容，不要有任何前缀或解释
2. 保持原文的核心意思
3. 保持与上下文一致的风格和语气
4. 纯文本输出，不使用 Markdown 格式`
          : `你是一个专业的小说写作助手。请根据用户的改写指令和上下文，生成合适的内容。
        
上下文：
${textBefore}

要求：
1. 直接输出内容，不要有任何前缀或解释
2. 保持与上下文一致的风格和语气
3. 纯文本输出，不使用 Markdown 格式`,
      };

      let fullResponse = "";
      let fullReasoning = "";

      // 监听流式响应
      const handler = (_e: unknown, payload: any) => {
        if (payload?.type === "reasoning-delta") {
          fullReasoning += payload.text || "";
          setReasoning(fullReasoning);
        } else if (payload?.type === "text-delta") {
          fullResponse += payload.text || "";
          setResponse(fullResponse);
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
      // 清理监听器
      (window as any).electron?.ipcRenderer.removeAllListeners(channel);
    }
  }, [prompt, status, editor, isPolishMode, markId]);

  // 键盘事件 - 回车发送，上下键导航，Backspace 删除
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit();
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        const pos = props.getPos();
        deleteNode();
        // focus 到上一个节点的末尾
        editor.chain().focus().setTextSelection(pos).run();
        return;
      }

      // Backspace：输入框为空时删除块并 focus 到上一个节点末尾
      if (e.key === "Backspace" && textarea.value === "") {
        e.preventDefault();
        const pos = props.getPos();
        deleteNode();
        // focus 到上一个节点的末尾
        editor.chain().focus().setTextSelection(pos).run();
        return;
      }

      // 上键：光标在第一行时，移动到上一个节点
      if (e.key === "ArrowUp") {
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = textarea.value.substring(0, cursorPos);
        const isFirstLine = !textBeforeCursor.includes("\n");

        if (isFirstLine) {
          e.preventDefault();
          // 获取当前节点位置并移动到上方
          const pos = props.getPos();
          editor.chain().focus().setTextSelection(pos).run();
        }
        return;
      }

      // 下键：光标在最后一行时，移动到下一个节点
      if (e.key === "ArrowDown") {
        const cursorPos = textarea.selectionStart;
        const textAfterCursor = textarea.value.substring(cursorPos);
        const isLastLine = !textAfterCursor.includes("\n");

        if (isLastLine) {
          e.preventDefault();
          // 获取当前节点位置并移动到下方
          const pos = props.getPos();
          const nodeSize = node.nodeSize;
          editor
            .chain()
            .focus()
            .setTextSelection(pos + nodeSize)
            .run();
        }
        return;
      }
    },
    [handleSubmit, deleteNode, editor, node, props]
  );

  // 应用结果
  const handleApply = useCallback(() => {
    if (!response.trim()) return;
    editor.commands.applyAIRewrite(nodeId, response.trim());
  }, [editor, nodeId, response]);

  // 取消/关闭
  const handleCancel = useCallback(() => {
    // 如果是润色模式，需要移除关联的 mark
    if (isPolishMode && markId) {
      editor.commands.removeAIRewrite(nodeId);
    } else {
      deleteNode();
    }
  }, [deleteNode, editor, isPolishMode, markId, nodeId]);

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
                ? t("common.aiRewrite.polishPlaceholder")
                : t("common.aiRewrite.generatePlaceholder")
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
          {(status === "success" || status === "error") && (
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={handleCancel}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-full transition-colors"
              >
                <X className="size-4" />
              </button>
              {status === "success" && response && (
                <button
                  onClick={handleApply}
                  className="p-1 bg-foreground text-background hover:bg-foreground/90 rounded-full transition-colors"
                >
                  <Check className="size-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reasoning 思考过程 - 只在思考中显示 */}
        {reasoning && status === "loading" && !response && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-2">
            <BrainIcon className="size-3" />
            <span>{t("common.aiRewrite.thinking")}</span>
          </div>
        )}

        {/* 响应区域 */}
        {response && (
          <div className="p-1">
            <div className="text-sm whitespace-pre-wrap select-text text-foreground">
              {response}
              {status === "loading" && (
                <span className="inline-block w-0.5 h-3.5 bg-foreground/40 animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {status === "error" && (
          <div className="text-sm text-destructive">{error}</div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
