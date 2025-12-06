/**
 * AI Inline Edit Extension
 *
 * 轻量级内联 AI 编辑功能：
 * - Cmd+K 触发编辑浮层
 * - 输入指令后在原文中显示 diff（使用 Mark 持久化）
 * - 原文标记为 aiDiffDelete（红色删除线）
 * - 新内容标记为 aiDiffInsert（绿色高亮）
 * - Accept/Reject 操作
 * - 可用 Cmd+Z 撤销
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { gen } from "@common/lib/generator";

export interface AIInlineEditOptions {
  /** AI 编辑请求处理函数 */
  onEdit?: (params: AIEditParams) => Promise<ReadableStream<string> | string>;
}

export interface AIEditParams {
  /** 选中的文本 */
  selection: string;
  /** 用户输入的指令 */
  instruction: string;
  /** 选区位置 */
  from: number;
  to: number;
  /** 上下文（选区前后的文本） */
  context?: {
    before: string;
    after: string;
  };
}

export interface AIEditTriggerEvent {
  selection: string;
  from: number;
  to: number;
  context?: {
    before: string;
    after: string;
  };
}

/** Diff 结果数据 */
export interface AIDiffResult {
  diffId: string;
  originalText: string;
  newText: string;
  from: number;
  to: number;
}

/** 生成唯一 diffId */
const generateDiffId = () => gen.id({ prefix: "diff-", length: 12 });

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiInlineEdit: {
      /** 触发 AI 内联编辑（显示浮层） */
      triggerAIEdit: () => ReturnType;
      /** 执行 AI 编辑（异步，立即返回 true） */
      executeAIEdit: (instruction: string) => ReturnType;
      /** 取消 AI 编辑 */
      cancelAIEdit: () => ReturnType;
      /** 接受指定 ID 的 AI 编辑 */
      acceptAIDiff: (diffId: string) => ReturnType;
      /** 拒绝指定 ID 的 AI 编辑 */
      rejectAIDiff: (diffId: string) => ReturnType;
      /** 接受所有 AI 编辑 */
      acceptAllAIDiffs: () => ReturnType;
      /** 拒绝所有 AI 编辑 */
      rejectAllAIDiffs: () => ReturnType;
    };
  }
}

const pluginKey = new PluginKey("aiInlineEdit");

export const AIInlineEdit = Extension.create<AIInlineEditOptions>({
  name: "aiInlineEdit",

  addOptions() {
    return {
      onEdit: undefined,
    };
  },

  addStorage() {
    return {
      isEditing: false,
      abortController: null as AbortController | null,
      pendingSelection: null as AIEditTriggerEvent | null,
    };
  },

  addCommands() {
    return {
      triggerAIEdit:
        () =>
        ({ state }) => {
          const { from, to } = state.selection;
          if (from === to) {
            console.log("[AIInlineEdit] No selection, cannot trigger edit");
            return false;
          }

          const selection = state.doc.textBetween(from, to, "\n");
          if (!selection.trim()) {
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

          // 存储选区信息
          this.storage.pendingSelection = {
            selection,
            from,
            to,
            context: { before: contextBefore, after: contextAfter },
          };
          this.storage.isEditing = true;

          // 触发 UI 事件
          const event = new CustomEvent("ai:edit:trigger", {
            detail: this.storage.pendingSelection,
          });
          window.dispatchEvent(event);

          return true;
        },

      executeAIEdit: (instruction: string) => () => {
        const pending = this.storage.pendingSelection;
        if (!pending) {
          console.log("[AIInlineEdit] No pending selection");
          return false;
        }

        const { from, to, selection, context } = pending;
        const onEdit = this.options.onEdit;
        const storage = this.storage;

        if (!onEdit) {
          console.log("[AIInlineEdit] No onEdit handler configured");
          return false;
        }

        // 创建 AbortController
        const abortController = new AbortController();
        storage.abortController = abortController;

        // 异步执行编辑（不阻塞命令返回）
        (async () => {
          try {
            // 调用 AI 服务
            const result = await onEdit({
              selection,
              instruction,
              from,
              to,
              context,
            });

            if (abortController.signal.aborted) {
              return;
            }

            // 收集完整内容
            let fullText = "";

            if (typeof result === "string") {
              fullText = result;
            } else {
              // 流式收集完整文本
              const reader = result.getReader();
              const decoder = new TextDecoder();

              while (true) {
                if (abortController.signal.aborted) {
                  break;
                }

                const { done, value } = await reader.read();
                if (done) break;

                const text =
                  typeof value === "string"
                    ? value
                    : decoder.decode(value, { stream: true });
                if (text) {
                  fullText += text;

                  // 触发流式更新事件（用于实时显示）
                  window.dispatchEvent(
                    new CustomEvent("ai:edit:stream", {
                      detail: { text: fullText },
                    })
                  );
                }
              }
            }

            if (abortController.signal.aborted || !fullText.trim()) {
              return;
            }

            const newText = fullText.trim();
            const editor = this.editor;
            const diffId = generateDiffId();

            // 简化设计：直接替换原文为新内容，并添加 aiDiff mark（保存原文）
            const { tr } = editor.state;
            const diffMarkType = editor.schema.marks.aiDiff;

            if (diffMarkType) {
              // 1. 删除原文
              tr.delete(from, to);
              
              // 2. 插入带有 aiDiff mark 的新内容（mark 中保存原文用于 reject）
              const diffMark = diffMarkType.create({ diffId, originalText: selection });
              const textNode = editor.schema.text(newText, [diffMark]);
              tr.insert(from, textNode);
            }

            // 应用事务
            editor.view.dispatch(tr);

            console.log("[AIInlineEdit] Diff created:", diffId, {
              from,
              to,
              originalText: selection,
              newText,
            });

            // 清理编辑状态
            storage.isEditing = false;
            storage.abortController = null;
            storage.pendingSelection = null;

            // 触发 diff 创建事件
            window.dispatchEvent(
              new CustomEvent("ai:diff:created", {
                detail: { diffId, originalText: selection, newText, from },
              })
            );
          } catch (error: any) {
            console.error("[AIInlineEdit] Error:", error);
            storage.isEditing = false;
            storage.abortController = null;
            storage.pendingSelection = null;

            // 触发错误事件
            window.dispatchEvent(
              new CustomEvent("ai:edit:error", {
                detail: { error: error.message },
              })
            );
          }
        })();

        // 立即返回 true，异步处理在后台进行
        return true;
      },

      cancelAIEdit: () => () => {
        // 终止正在进行的请求
        if (this.storage.abortController) {
          this.storage.abortController.abort();
          this.storage.abortController = null;
        }

        this.storage.pendingSelection = null;
        this.storage.isEditing = false;

        // 触发取消事件
        window.dispatchEvent(new CustomEvent("ai:edit:cancel"));

        return true;
      },

      /** 接受指定 diffId 的编辑：只需移除 mark，保留当前内容 */
      acceptAIDiff:
        (diffId: string) =>
        () => {
          const editor = this.editor;
          const { state } = editor;
          
          let diffFrom = -1, diffTo = -1;
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
            console.log("[AIInlineEdit] Diff not found:", diffId);
            return false;
          }

          // Accept: 删除带 mark 的内容，插入纯净内容（移除 mark）
          const { tr } = state;
          tr.delete(diffFrom, diffTo);
          tr.insertText(newContent, diffFrom);
          editor.view.dispatch(tr);

          // 触发接受事件
          window.dispatchEvent(
            new CustomEvent("ai:diff:accepted", { detail: { diffId } })
          );

          return true;
        },

      /** 拒绝指定 diffId 的编辑：用保存的原文替换当前内容 */
      rejectAIDiff:
        (diffId: string) =>
        () => {
          const editor = this.editor;
          const { state } = editor;
          
          let diffFrom = -1, diffTo = -1;
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
            console.log("[AIInlineEdit] Diff not found:", diffId);
            return false;
          }

          // Reject: 删除带 mark 的内容，插入原文
          const { tr } = state;
          tr.delete(diffFrom, diffTo);
          tr.insertText(originalText, diffFrom);
          editor.view.dispatch(tr);

          // 触发拒绝事件
          window.dispatchEvent(
            new CustomEvent("ai:diff:rejected", { detail: { diffId } })
          );

          return true;
        },

      /** 接受所有 AI 编辑 */
      acceptAllAIDiffs: () => ({ state }) => {
        const diffIds = new Set<string>();

        // 收集所有 diffId
        state.doc.descendants((node) => {
          if (!node.isText) return;
          node.marks.forEach((mark) => {
            if (mark.type.name === "aiDiff" && mark.attrs.diffId) {
              diffIds.add(mark.attrs.diffId);
            }
          });
        });

        // 逐个接受
        const ids = Array.from(diffIds);
        for (const diffId of ids) {
          this.editor.commands.acceptAIDiff(diffId);
        }

        // 触发全部接受事件
        window.dispatchEvent(new CustomEvent("ai:diff:allAccepted"));

        return true;
      },

      /** 拒绝所有 AI 编辑 */
      rejectAllAIDiffs: () => ({ state }) => {
        const diffIds = new Set<string>();

        // 收集所有 diffId
        state.doc.descendants((node) => {
          if (!node.isText) return;
          node.marks.forEach((mark) => {
            if (mark.type.name === "aiDiff" && mark.attrs.diffId) {
              diffIds.add(mark.attrs.diffId);
            }
          });
        });

        // 逐个拒绝
        const ids = Array.from(diffIds);
        for (const diffId of ids) {
          this.editor.commands.rejectAIDiff(diffId);
        }

        // 触发全部拒绝事件
        window.dispatchEvent(new CustomEvent("ai:diff:allRejected"));

        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-k": () => {
        return this.editor.commands.triggerAIEdit();
      },
    };
  },

  addProseMirrorPlugins() {
    const storage = this.storage;

    return [
      new Plugin({
        key: pluginKey,
        props: {
          handleKeyDown: (_view, event) => {
            // Escape 取消正在进行的编辑
            if (event.key === "Escape" && storage.isEditing) {
              this.editor.commands.cancelAIEdit();
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});
