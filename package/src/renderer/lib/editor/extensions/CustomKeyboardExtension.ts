/**
 * 自定义键盘快捷键扩展
 * - Cmd+A: 渐进式选择（先选段落，再选全文）
 * - Alt+Backspace: 删除到上一个标点符号
 *
 * 注意：Cmd+W 由 useExpandRegion hook 通过 IPC 处理
 */

import { Extension } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

// 标点符号（中英文）+ 空格
const PUNCTUATION_CHARS = `，。！？；：、""''（）【】《》—…,.!?;:'"()[]<>-· `;

function isPunctuation(char: string): boolean {
  return PUNCTUATION_CHARS.includes(char);
}

export const CustomKeyboardExtension = Extension.create({
  name: "customKeyboard",

  addStorage() {
    return {
      // 记录上次选中的段落范围（使用 storage 而非模块级变量，确保每个编辑器实例独立）
      lastParagraphRange: null as { from: number; to: number } | null,
    };
  },

  addKeyboardShortcuts() {
    return {
      // Cmd+A: 渐进式选择
      "Mod-a": ({ editor }) => {
        const { state } = editor;
        const { selection, doc } = state;
        const { $from } = selection;

        // 检查是否有 title 节点
        const firstChild = doc.firstChild;
        const hasTitle = firstChild && firstChild.type.name === "title";

        // 如果光标在 title 节点内，只选中 title 的文本
        if (hasTitle && $from.parent.type.name === "title") {
          // 选中 title 节点内的所有文本（位置 1 到 firstChild.nodeSize - 1）
          const titleStart = 1; // title 节点内容开始
          const titleEnd = firstChild.nodeSize - 1; // title 节点内容结束

          // 如果已经选中了 title 全部内容，不做任何操作
          if (selection.from === titleStart && selection.to === titleEnd) {
            return true;
          }

          editor
            .chain()
            .focus()
            .setTextSelection({ from: titleStart, to: titleEnd })
            .run();
          return true;
        }

        // 计算正文起始位置（跳过 title 节点）
        const contentStart = hasTitle ? firstChild.nodeSize : 0;
        const docEnd = doc.content.size;

        // 检查是否已经是全文选中状态
        // 使用宽松的比较（允许 1 的误差，处理边界情况）
        const isFullDocSelected =
          selection.from <= contentStart + 1 &&
          selection.to >= docEnd - 1 &&
          selection.to - selection.from > 10; // 确保选中了足够多的内容

        if (isFullDocSelected) {
          return true; // 保持当前选区，不做任何操作
        }

        // 获取当前段落的范围
        const paragraphStart = $from.start($from.depth);
        const paragraphEnd = $from.end($from.depth);

        // 确保段落范围在 title 之后
        const safeParagraphStart = Math.max(paragraphStart, contentStart);

        const isCurrentParagraphSelected =
          selection.from === safeParagraphStart &&
          selection.to === paragraphEnd;

        const lastParagraphRange = this.storage.lastParagraphRange;

        // 检查是否是连续按 Cmd+A
        const wasLastSelectSameParagraph =
          lastParagraphRange?.from === safeParagraphStart &&
          lastParagraphRange?.to === paragraphEnd &&
          isCurrentParagraphSelected;

        if (wasLastSelectSameParagraph) {
          // 第二次按 Cmd+A：全选文档（跳过 title 节点）
          editor
            .chain()
            .focus()
            .setTextSelection({ from: contentStart, to: docEnd })
            .run();
          this.storage.lastParagraphRange = null;
        } else {
          // 第一次按 Cmd+A：选中当前段落
          editor
            .chain()
            .focus()
            .setTextSelection({ from: safeParagraphStart, to: paragraphEnd })
            .run();
          this.storage.lastParagraphRange = {
            from: safeParagraphStart,
            to: paragraphEnd,
          };
        }

        return true;
      },

      // Alt+Backspace: 删除到上一个标点符号（如果紧邻标点则删除该标点）
      "Alt-Backspace": ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { from } = selection;

        // 获取光标前的文本
        const $from = state.doc.resolve(from);
        const blockStart = $from.start($from.depth);
        const textBefore = state.doc.textBetween(blockStart, from, "");

        if (!textBefore) return false;

        const lastChar = textBefore[textBefore.length - 1];

        // 如果光标前一位是标点，删除这个标点
        if (isPunctuation(lastChar)) {
          editor
            .chain()
            .focus()
            .deleteRange({ from: from - 1, to: from })
            .run();
          return true;
        }

        // 从后往前找标点符号
        let deleteStart = blockStart;
        for (let i = textBefore.length - 1; i >= 0; i--) {
          if (isPunctuation(textBefore[i])) {
            deleteStart = blockStart + i + 1;
            break;
          }
        }

        // 删除从标点符号后到光标的内容
        if (deleteStart < from) {
          editor
            .chain()
            .focus()
            .deleteRange({ from: deleteStart, to: from })
            .run();
          return true;
        }

        return false;
      },

      // Backspace: 特殊处理
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { selection, doc } = state;
        const { $from, empty } = selection;

        // 必须是光标选区（没有选中内容）
        if (!empty) return false;

        // 检查光标是否在节点最开始位置
        const isAtStart = $from.parentOffset === 0;
        if (!isAtStart) return false;

        const parent = $from.parent;
        const pos = $from.before();

        // 获取上一个节点
        let nodeBefore: ProseMirrorNode | null = null;
        if (pos > 0) {
          const $before = doc.resolve(pos);
          nodeBefore = $before.nodeBefore;
        }

        // ===== 处理段落 =====
        if (parent.type.name === "paragraph") {
          // 如果段落前一个节点是 blockquote，且当前段落为空
          // 默认行为会把当前段落“合并进” blockquote，导致 blockquote 内出现一个新的空段落（看起来像多了一行）
          // 这里改为：删除当前空段落，并把光标移动到 blockquote 的末尾
          if (
            nodeBefore &&
            nodeBefore.type.name === "blockquote" &&
            parent.content.size === 0
          ) {
            const tr = state.tr;

            // 删除当前空段落
            tr.delete(pos, pos + parent.nodeSize);

            // 光标移动到 blockquote 的末尾（偏向前一个节点内部的可落点位置）
            const targetPos = Math.min(pos - 1, tr.doc.content.size);
            tr.setSelection(TextSelection.near(tr.doc.resolve(targetPos), -1));

            editor.view.dispatch(tr);
            return true;
          }

          // 如果上一个节点是标题，将段落内容合并到标题中
          if (nodeBefore && nodeBefore.type.name === "heading") {
            // 获取段落内容
            const paragraphContent = parent.content;
            // 获取上一个节点（标题）的结束位置
            const headingEndPos = pos - 1; // 标题内容的末尾

            // 删除当前段落，并将内容追加到标题
            const tr = state.tr;

            // 先删除段落节点
            tr.delete(pos, pos + parent.nodeSize);

            // 如果段落有内容，追加到标题末尾
            if (paragraphContent.size > 0) {
              tr.insert(headingEndPos, paragraphContent);
            }

            // 设置光标位置到原标题内容末尾
            const newCursorPos = headingEndPos;
            tr.setSelection(TextSelection.near(tr.doc.resolve(newCursorPos)));

            editor.view.dispatch(tr);
            return true;
          }
          // 其他情况使用默认行为
          return false;
        }

        // ===== 处理标题 =====
        if (parent.type.name === "heading") {
          // 检查是否是文档第一个节点
          if (pos <= 0 || !nodeBefore) {
            // 是第一个节点或没有上一个节点，将标题转换为段落
            editor.chain().focus().setNode("paragraph").run();
            return true;
          }

          // 如果上一个节点不是段落，将标题转换为段落
          if (nodeBefore.type.name !== "paragraph") {
            editor.chain().focus().setNode("paragraph").run();
            return true;
          }

          // 上一个节点是段落
          const isNodeBeforeEmpty = nodeBefore.content.size === 0;

          // 如果上一个节点是空段落，使用默认行为（删除空段落）
          if (isNodeBeforeEmpty) {
            return false;
          }

          // 上一个节点是有内容的段落，将标题转换为段落
          editor.chain().focus().setNode("paragraph").run();
          return true;
        }

        // 其他节点类型，使用默认行为
        return false;
      },

      // Enter: 当空标题按回车时，将其转换为普通段落
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        // 必须是光标选区（没有选中内容）
        if (!empty) return false;

        // 检查当前节点是否是标题
        const parent = $from.parent;
        if (parent.type.name !== "heading") return false;

        // 检查标题是否为空
        const isHeadingEmpty = parent.content.size === 0;
        if (!isHeadingEmpty) return false;

        // 空标题按回车，转换为普通段落
        editor.chain().focus().setNode("paragraph").run();
        return true;
      },

      // Mod-Enter: 在当前节点下方插入新段落
      "Mod-Enter": ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // 如果在 title 节点中，不处理
        if ($from.parent.type.name === "title") {
          return false;
        }

        // 找到 doc 下的顶层块级节点（depth 1 是 doc 的直接子节点）
        // 对于嵌套节点如 codeBlock，$from.depth 可能 > 1
        let blockDepth = $from.depth;
        while (
          blockDepth > 1 &&
          $from.node(blockDepth - 1).type.name !== "doc"
        ) {
          blockDepth--;
        }

        // 获取顶层块级节点的结束位置
        const endOfNode = $from.end(blockDepth);
        const afterNode = endOfNode + 1;

        // 在当前节点后插入一个新段落并聚焦
        editor
          .chain()
          .focus()
          .command(({ tr, dispatch }) => {
            if (dispatch) {
              const paragraph = state.schema.nodes.paragraph.create();
              tr.insert(afterNode, paragraph);
              // 将光标移动到新段落中
              tr.setSelection(
                TextSelection.near(tr.doc.resolve(afterNode + 1))
              );
            }
            return true;
          })
          .run();

        return true;
      },

      // Mod-Shift-Enter: 在当前节点上方插入新段落
      "Mod-Shift-Enter": ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // 如果在 title 节点中，不处理
        if ($from.parent.type.name === "title") {
          return false;
        }

        // 找到 doc 下的顶层块级节点（depth 1 是 doc 的直接子节点）
        let blockDepth = $from.depth;
        while (
          blockDepth > 1 &&
          $from.node(blockDepth - 1).type.name !== "doc"
        ) {
          blockDepth--;
        }

        // 获取顶层块级节点的开始位置
        const startOfNode = $from.before(blockDepth);

        // 在当前节点前插入一个新段落并聚焦
        editor
          .chain()
          .focus()
          .command(({ tr, dispatch }) => {
            if (dispatch) {
              const paragraph = state.schema.nodes.paragraph.create();
              tr.insert(startOfNode, paragraph);
              // 将光标移动到新段落中
              tr.setSelection(
                TextSelection.near(tr.doc.resolve(startOfNode + 1))
              );
            }
            return true;
          })
          .run();

        return true;
      },
    };
  },
});
