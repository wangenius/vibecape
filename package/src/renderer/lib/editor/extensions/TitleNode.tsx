/**
 * TitleNode Extension
 * 文档顶部的固定标题节点，无法删除
 * 替代原来的 TitleInput 组件
 */

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";

export interface TitleNodeOptions {
  HTMLAttributes: Record<string, unknown>;
  placeholder?: string;
}

// React 组件用于渲染标题节点
const TitleNodeView = ({ node, editor }: { node: any; editor: any }) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(node.textContent || "");

  // 同步外部内容变化
  useEffect(() => {
    setValue(node.textContent || "");
  }, [node.textContent]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter 或 ArrowDown: 聚焦到编辑器内容
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      // 将焦点移动到 title 节点之后的第一个内容节点
      const pos = editor.state.doc.firstChild?.nodeSize || 0;
      editor.commands.focus(pos + 1);
    }
    // 阻止 Backspace 在开头时删除 title 节点
    if (e.key === "Backspace" && inputRef.current?.selectionStart === 0) {
      if (inputRef.current?.selectionEnd === 0) {
        e.preventDefault();
      }
    }
    // ArrowUp 在 title input 中无操作（已在顶部）
    if (e.key === "ArrowUp") {
      e.preventDefault();
    }
  };

  // 处理内容变化 - 使用 ProseMirror transaction 来更新文本内容
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // 使用 transaction 更新节点的文本内容
    const { state, view } = editor;
    const titleNode = state.doc.firstChild;

    if (titleNode && titleNode.type.name === "title") {
      const tr = state.tr;
      const contentStart = 1; // title 节点内容开始位置
      const contentEnd = 1 + titleNode.content.size;

      if (newValue) {
        // 有内容时，替换为新文本
        tr.replaceWith(contentStart, contentEnd, state.schema.text(newValue));
      } else {
        // 无内容时，删除所有内容
        tr.delete(contentStart, contentEnd);
      }
      view.dispatch(tr);
    }
  };

  return (
    <NodeViewWrapper className="title-node-wrapper">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="title-node-input"
        placeholder={t("common.settings.enterTitle")}
        autoComplete="off"
        spellCheck={false}
      />
    </NodeViewWrapper>
  );
};

/**
 * Document 节点扩展 - 强制第一个节点必须是 title
 */
export const CustomDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "title block+",
});

/**
 * Title 节点 - 文档的固定标题
 */
export const TitleNode = Node.create<TitleNodeOptions>({
  name: "title",
  priority: 1000,

  // 作为 block 节点
  group: undefined, // 不属于任何 group，只能作为 doc 的第一个子节点

  // 内容：只允许纯文本
  content: "text*",

  // 不允许被选区选中整个节点（防止删除）
  selectable: false,

  // 定义为 defining 节点，这样它会保持结构
  defining: true,

  // 隔离节点，防止编辑操作跨越
  isolating: true,

  // 不允许被拖拽
  draggable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
      placeholder: "Untitled",
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="title"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "title",
        class: "title-node",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TitleNodeView);
  },

  addProseMirrorPlugins() {
    return [
      // 防止删除 title 节点的插件
      new Plugin({
        key: new PluginKey("preventTitleDeletion"),
        filterTransaction: (transaction) => {
          // 检查是否会删除 title 节点
          if (!transaction.docChanged) return true;

          const newDoc = transaction.doc;
          const firstChild = newDoc.firstChild;

          // 如果文档为空或第一个节点不是 title，阻止这个 transaction
          if (!firstChild || firstChild.type.name !== "title") {
            return false;
          }

          return true;
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      // 在 title 节点开头按 Backspace 不应该删除节点
      // 在 title 后的第一个节点开头按 Backspace 也不应该合并到 title
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        const { $from, empty } = selection;

        // 情况1：光标在 title 节点内且在最开头
        if ($from.parent.type.name === "title" && $from.parentOffset === 0) {
          return true; // 阻止默认行为
        }

        // 情况2：光标在 title 节点之后的第一个节点开头（空选区）
        // 这防止从第一个段落向前删除到 title 节点
        if (empty && $from.parentOffset === 0) {
          const doc = editor.state.doc;
          const titleNode = doc.firstChild;

          if (titleNode && titleNode.type.name === "title") {
            // 计算 title 节点之后的位置
            const afterTitlePos = titleNode.nodeSize;

            // 如果当前位置紧邻 title 节点之后
            // $from.before() 返回当前节点的起始位置
            // 我们需要检查当前节点是否是 title 节点之后的第一个节点
            try {
              const nodeBeforePos = $from.before($from.depth);
              // 如果这个节点的起始位置等于 title 节点的结束位置
              if (nodeBeforePos === afterTitlePos) {
                return true; // 阻止默认行为
              }
            } catch {
              // 如果 before() 失败，检查位置
              if ($from.pos <= afterTitlePos + 1) {
                return true;
              }
            }
          }
        }

        return false;
      },

      // 在 title 节点中按 Enter 应该跳到下一个节点
      Enter: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;

        if ($from.parent.type.name === "title") {
          // 移动到 title 节点之后
          const titleNodeSize = editor.state.doc.firstChild?.nodeSize || 0;
          editor.commands.focus(titleNodeSize + 1);
          return true;
        }
        return false;
      },

      // 阻止从第一个内容节点通过左键移动到 title 节点
      ArrowLeft: ({ editor }) => {
        const { selection } = editor.state;
        const { $from, empty } = selection;

        // 只处理空选区且光标在节点开头的情况
        if (empty && $from.parentOffset === 0) {
          const doc = editor.state.doc;
          const titleNode = doc.firstChild;

          if (titleNode && titleNode.type.name === "title") {
            const afterTitlePos = titleNode.nodeSize;

            // 检查当前节点是否紧邻 title 节点之后
            try {
              const nodeBeforePos = $from.before($from.depth);
              if (nodeBeforePos === afterTitlePos) {
                return true; // 阻止左移
              }
            } catch {
              if ($from.pos <= afterTitlePos + 1) {
                return true;
              }
            }
          }
        }
        return false;
      },

      // 从第一行通过上键移动到 title 节点的 input 末尾
      // 从第二行正常上移到第一行
      ArrowUp: ({ editor }) => {
        const { selection } = editor.state;
        const { $from, empty } = selection;

        if (empty) {
          const doc = editor.state.doc;
          const titleNode = doc.firstChild;

          if (titleNode && titleNode.type.name === "title") {
            const afterTitlePos = titleNode.nodeSize;

            // 检查当前节点是否是 title 节点之后的第一个节点
            try {
              const nodeBeforePos = $from.before($from.depth);
              if (nodeBeforePos === afterTitlePos) {
                // 聚焦到 title input 的末尾
                const titleInput =
                  document.querySelector<HTMLInputElement>(".title-node-input");
                if (titleInput) {
                  titleInput.focus();
                  // 将光标移动到末尾
                  titleInput.setSelectionRange(
                    titleInput.value.length,
                    titleInput.value.length
                  );
                }
                return true; // 阻止默认上移行为
              }
            } catch {
              if ($from.pos <= afterTitlePos + 1) {
                const titleInput =
                  document.querySelector<HTMLInputElement>(".title-node-input");
                if (titleInput) {
                  titleInput.focus();
                  titleInput.setSelectionRange(
                    titleInput.value.length,
                    titleInput.value.length
                  );
                }
                return true;
              }
            }
          }
        }
        return false;
      },
    };
  },
});

/**
 * 创建包含标题的初始文档内容
 */
export const createDocumentWithTitle = (
  title: string,
  content?: any[] | null
) => {
  const titleNode = {
    type: "title",
    content: title ? [{ type: "text", text: title }] : [],
  };

  // 如果提供了内容，使用提供的内容
  if (content && Array.isArray(content) && content.length > 0) {
    // 检查第一个节点是否已经是 title
    if (content[0]?.type === "title") {
      return {
        type: "doc",
        content: content,
      };
    }
    // 在内容前面添加 title 节点
    return {
      type: "doc",
      content: [titleNode, ...content],
    };
  }

  // 默认内容：title + 一个空段落
  return {
    type: "doc",
    content: [
      titleNode,
      {
        type: "paragraph",
        content: [],
      },
    ],
  };
};

/**
 * 从文档内容中提取标题
 */
export const getTitleFromDocument = (doc: any): string => {
  if (!doc || !doc.content || !Array.isArray(doc.content)) {
    return "";
  }

  const titleNode = doc.content.find((node: any) => node.type === "title");
  if (!titleNode || !titleNode.content) {
    return "";
  }

  return titleNode.content.map((textNode: any) => textNode.text || "").join("");
};
