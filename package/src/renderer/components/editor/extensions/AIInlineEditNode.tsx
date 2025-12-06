/**
 * AI Inline Edit Node 扩展
 *
 * 内联 AI 编辑功能（使用 inline node 方案）：
 * - Cmd+K 选中文本后，替换为此 node
 * - 输入指令后流式生成
 * - Accept: 用生成内容替换 node
 * - Reject: 用原文替换 node
 * - 支持 Cmd+Z 撤销
 */

import { Node, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import {
  useState,
  useCallback,
  useRef,
  useEffect,
  KeyboardEvent,
} from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { gen } from "@common/lib/generator";

export interface AIInlineEditNodeOptions {
  HTMLAttributes: Record<string, any>;
  /** AI 编辑请求处理函数 */
  onEdit?: (params: AIEditParams) => Promise<ReadableStream<string> | string>;
}

export interface AIEditParams {
  /** 选中的文本（原文） */
  selection: string;
  /** 用户输入的指令 */
  instruction: string;
  /** 上下文 */
  context?: {
    before: string;
    after: string;
  };
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiInlineEditNode: {
      /** 触发 AI 内联编辑：在选区下方插入输入节点 */
      triggerAIInlineEdit: () => ReturnType;
      /** 取消编辑：删除输入节点 */
      cancelAIInlineEdit: (nodeId: string) => ReturnType;
      /** 开始流式编辑：删除输入节点，删除原文，返回 diffId 和插入位置 */
      startStreamEdit: (nodeId: string) => ReturnType;
      /** 流式更新 diff 内容 */
      updateStreamDiff: (diffId: string, content: string, originalText: string) => ReturnType;
      /** 接受 AI Diff */
      acceptAIDiff: (diffId: string) => ReturnType;
      /** 拒绝 AI Diff */
      rejectAIDiff: (diffId: string) => ReturnType;
    };
  }
}

const pluginKey = new PluginKey("aiInlineEditNode");

export const AIInlineEditNode = Node.create<AIInlineEditNodeOptions>({
  name: "aiInlineEditNode",

  // 使用 block group，作为独立的输入块
  group: "block",

  // 原子节点，不可编辑内部
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      onEdit: undefined,
    };
  },

  addStorage() {
    return {
      // 流式编辑状态
      streamState: null as {
        diffId: string;
        insertPos: number;
        originalText: string;
      } | null,
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { "data-id": attributes.id };
        },
      },
      originalText: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-original-text") || "",
        renderHTML: (attributes) => {
          if (!attributes.originalText) return {};
          return { "data-original-text": attributes.originalText };
        },
      },
      // 原选区位置，用于替换
      selectionFrom: {
        default: 0,
      },
      selectionTo: {
        default: 0,
      },
      contextBefore: {
        default: "",
      },
      contextAfter: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="ai-inline-edit"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": "ai-inline-edit" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ];
  },

  addCommands() {
    return {
      triggerAIInlineEdit:
        () =>
        ({ state, tr, dispatch }) => {
          const { from, to } = state.selection;
          if (from === to) {
            console.log("[AIInlineEditNode] No selection");
            return false;
          }

          const selectedText = state.doc.textBetween(from, to, "\n");
          if (!selectedText.trim()) {
            return false;
          }

          // 获取上下文
          const contextBefore = state.doc.textBetween(
            Math.max(0, from - 200),
            from,
            "\n"
          );
          const contextAfter = state.doc.textBetween(
            to,
            Math.min(state.doc.content.size, to + 200),
            "\n"
          );

          const nodeId = gen.id({ prefix: "ai-edit-", length: 12 });

          // 创建 block node 插入到选区后面
          const nodeType = state.schema.nodes.aiInlineEditNode;
          if (!nodeType) {
            console.error("[AIInlineEditNode] Node type not found");
            return false;
          }

          const newNode = nodeType.create({
            id: nodeId,
            originalText: selectedText,
            selectionFrom: from,
            selectionTo: to,
            contextBefore,
            contextAfter,
          });

          // 找到选区所在块的结束位置，在其后插入节点
          const $to = state.doc.resolve(to);
          // 获取包含选区的最近的 block 节点的结束位置
          let insertPos = $to.after($to.depth);
          
          // 如果在文档末尾，需要调整
          if (insertPos > state.doc.content.size) {
            insertPos = state.doc.content.size;
          }

          tr.insert(insertPos, newNode);

          if (dispatch) dispatch(tr);
          return true;
        },

      cancelAIInlineEdit:
        (nodeId: string) =>
        ({ state, tr, dispatch }) => {
          let found = false;

          state.doc.descendants((node, pos) => {
            if (
              node.type.name === "aiInlineEditNode" &&
              node.attrs.id === nodeId
            ) {
              // 只删除节点，不影响原文
              tr.delete(pos, pos + node.nodeSize);
              found = true;
              return false;
            }
            return true;
          });

          if (found && dispatch) dispatch(tr);
          return found;
        },

      /** 开始流式编辑：删除输入节点，删除原文，返回信息用于流式更新 */
      startStreamEdit:
        (nodeId: string) =>
        ({ state, tr, dispatch }) => {
          let nodePos = -1;
          let selFrom = 0;
          let selTo = 0;
          let originalText = "";

          // 找到节点并获取原选区信息
          state.doc.descendants((node, pos) => {
            if (
              node.type.name === "aiInlineEditNode" &&
              node.attrs.id === nodeId
            ) {
              nodePos = pos;
              selFrom = node.attrs.selectionFrom;
              selTo = node.attrs.selectionTo;
              originalText = node.attrs.originalText;
              return false;
            }
            return true;
          });

          if (nodePos === -1) {
            console.log("[AIInlineEditNode] Node not found:", nodeId);
            return false;
          }

          const diffId = gen.id({ prefix: "diff-", length: 12 });

          // 1. 删除输入节点
          tr.delete(nodePos, nodePos + state.doc.nodeAt(nodePos)!.nodeSize);

          // 2. 删除原选区内容
          tr.delete(selFrom, selTo);

          if (dispatch) dispatch(tr);

          // 保存流式状态到 storage
          this.storage.streamState = {
            diffId,
            insertPos: selFrom,
            originalText,
          };

          return true;
        },

      /** 流式更新 diff 内容 */
      updateStreamDiff:
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
            // 首次插入：从 storage 获取插入位置
            const streamState = this.storage.streamState;
            if (streamState && streamState.diffId === diffId) {
              tr.insert(streamState.insertPos, textNode);
            } else {
              return false;
            }
          } else {
            // 更新现有内容
            tr.replaceWith(diffFrom, diffTo, textNode);
          }

          if (dispatch) dispatch(tr);
          return true;
        },

      /** 接受指定 diffId 的编辑：只需移除 mark，保留当前内容 */
      acceptAIDiff:
        (diffId: string) =>
        ({ state, tr, dispatch }) => {
          let diffFrom = -1;
          let diffTo = -1;
          let newContent = "";

          // 遍历文档找到对应 diffId 的 Mark 范围
          state.doc.descendants((node, pos) => {
            if (!node.isText) return;

            const diffMark = node.marks.find(
              (m) => m.type.name === "aiDiff" && m.attrs.diffId === diffId
            );

            if (diffMark) {
              if (diffFrom === -1) diffFrom = pos;
              diffTo = pos + node.nodeSize;
              newContent += node.text || "";
            }
          });

          if (diffFrom === -1) {
            console.log("[AIInlineEditNode] Diff not found:", diffId);
            return false;
          }

          // Accept: 删除带 mark 的内容，插入纯净内容（移除 mark）
          tr.delete(diffFrom, diffTo);
          tr.insertText(newContent, diffFrom);

          if (dispatch) dispatch(tr);
          return true;
        },

      /** 拒绝指定 diffId 的编辑：用保存的原文替换当前内容 */
      rejectAIDiff:
        (diffId: string) =>
        ({ state, tr, dispatch }) => {
          let diffFrom = -1;
          let diffTo = -1;
          let originalText = "";

          // 遍历文档找到对应 diffId 的 Mark 范围和原文
          state.doc.descendants((node, pos) => {
            if (!node.isText) return;

            const diffMark = node.marks.find(
              (m) => m.type.name === "aiDiff" && m.attrs.diffId === diffId
            );

            if (diffMark) {
              if (diffFrom === -1) {
                diffFrom = pos;
                // 原文保存在第一个节点的 mark attrs 中
                originalText = diffMark.attrs.originalText || "";
              }
              diffTo = pos + node.nodeSize;
            }
          });

          if (diffFrom === -1) {
            console.log("[AIInlineEditNode] Diff not found:", diffId);
            return false;
          }

          // Reject: 删除带 mark 的内容，插入原文
          tr.delete(diffFrom, diffTo);
          tr.insertText(originalText, diffFrom);

          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-k": () => {
        return this.editor.commands.triggerAIInlineEdit();
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AIInlineEditComponent);
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: pluginKey,
        props: {
          // 阻止在节点内部输入
          handleTextInput: (view, from) => {
            const node = view.state.doc.nodeAt(from);
            if (node?.type.name === "aiInlineEditNode") {
              return true; // 阻止输入
            }
            return false;
          },
        },
      }),
    ];
  },
});

/**
 * AI Inline Edit 组件
 */
function AIInlineEditComponent(props: any) {
  const { t } = useTranslation();
  const { node, editor, extension } = props;
  const nodeId = node.attrs.id as string;
  const originalText = node.attrs.originalText as string;
  const contextBefore = node.attrs.contextBefore as string;
  const contextAfter = node.attrs.contextAfter as string;

  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 获取 onEdit 回调
  const onEdit = extension?.options?.onEdit;

  // 自动聚焦
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // 发送请求：立即删除节点，开始流式写入 DiffMark
  const handleSubmit = useCallback(async () => {
    if (!instruction.trim() || isSubmitting || !onEdit) return;

    setIsSubmitting(true);
    setError("");

    try {
      // 1. 先获取 AI 结果
      const result = await onEdit({
        selection: originalText,
        instruction: instruction.trim(),
        context: {
          before: contextBefore,
          after: contextAfter,
        },
      });

      // 2. 删除输入节点，开始流式编辑
      editor.commands.startStreamEdit(nodeId);

      // 3. 获取 storage 中的 diffId
      const streamState = editor.storage.aiInlineEditNode?.streamState;
      if (!streamState) {
        console.error("[AIInlineEditNode] No stream state");
        return;
      }

      const { diffId, originalText: savedOriginalText } = streamState;

      // 4. 流式处理
      if (typeof result === "string") {
        // 非流式：直接更新
        editor.commands.updateStreamDiff(diffId, result, savedOriginalText);
      } else {
        // 流式处理
        const reader = result.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text =
            typeof value === "string"
              ? value
              : decoder.decode(value, { stream: true });

          if (text) {
            fullText += text;
            // 流式更新 diff 内容
            editor.commands.updateStreamDiff(
              diffId,
              fullText,
              savedOriginalText
            );
          }
        }
      }

      // 5. 清理 storage
      editor.storage.aiInlineEditNode.streamState = null;
    } catch (err: any) {
      console.error("[AIInlineEditNode] Error:", err);
      setError(err.message || "请求失败");
      setIsSubmitting(false);
    }
  }, [instruction, isSubmitting, onEdit, originalText, contextBefore, contextAfter, editor, nodeId]);

  // 取消：删除输入节点
  const handleCancel = useCallback(() => {
    editor.commands.cancelAIInlineEdit(nodeId);
  }, [editor, nodeId]);

  // 键盘事件
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit();
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleCancel();
        return;
      }
    },
    [handleSubmit, handleCancel]
  );

  return (
    <NodeViewWrapper
      as="div"
      className="ai-inline-edit-node my-2"
      data-type="ai-inline-edit"
      data-id={nodeId}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md",
          "bg-muted/50 border border-border"
        )}
        contentEditable={false}
      >
        {/* 状态图标 */}
        {isSubmitting ? (
          <Loader2 className="size-4 text-primary animate-spin shrink-0" />
        ) : (
          <Sparkles className="size-4 text-primary shrink-0" />
        )}

        {/* 输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("editor.aiEdit.placeholder", "输入修改指令...")}
          disabled={isSubmitting}
          className={cn(
            "flex-1 bg-transparent border-none outline-none",
            "text-sm",
            "placeholder:text-muted-foreground/50",
            isSubmitting && "opacity-50"
          )}
        />

        {/* 取消按钮 */}
        {!isSubmitting && (
          <button
            onClick={handleCancel}
            className="p-0.5 hover:bg-muted rounded transition-colors"
            title={t("common.cancel", "取消")}
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        )}

        {/* 错误提示 */}
        {error && (
          <span className="text-xs text-destructive ml-1">{error}</span>
        )}
      </div>
    </NodeViewWrapper>
  );
}
