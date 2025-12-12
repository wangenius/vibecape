/**
 * TitleNode Extension
 * 文档顶部的固定标题节点，无法删除
 * 使用 ProseMirror 原生渲染，可直接编辑
 */

import { Node, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface TitleNodeOptions {
  HTMLAttributes: Record<string, unknown>;
  placeholder?: string;
}

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
 * 使用原生 ProseMirror 渲染，支持直接编辑
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
        tag: 'h1[data-type="title"]',
      },
      {
        tag: 'div[data-type="title"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "h1",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "title",
        class: "title-node",
      }),
      0,
    ];
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

        // 情况1：光标在 title 节点内且在最开头（空选区）
        // 有选中内容时允许删除（清空 title 文本）
        if (
          empty &&
          $from.parent.type.name === "title" &&
          $from.parentOffset === 0
        ) {
          return true; // 阻止默认行为
        }

        // 情况2：光标在 title 节点之后的第一个节点开头（空选区）
        // 这防止从第一个段落向前删除到 title 节点
        if (empty && $from.parentOffset === 0) {
          const doc = editor.state.doc;
          const titleNode = doc.firstChild;

          if (titleNode && titleNode.type.name === "title") {
            const afterTitlePos = titleNode.nodeSize;

            try {
              const nodeBeforePos = $from.before($from.depth);
              if (nodeBeforePos === afterTitlePos) {
                // 如果当前节点是 heading，让 CustomKeyboardExtension 处理（转换为 paragraph）
                if ($from.parent.type.name === "heading") {
                  return false;
                }
                return true; // 其他节点阻止默认行为
              }
            } catch {
              if ($from.pos <= afterTitlePos + 1) {
                // 同样，heading 不拦截
                if ($from.parent.type.name === "heading") {
                  return false;
                }
                return true;
              }
            }
          }
        }

        return false;
      },

      // 在 title 节点中按 Enter 应该跳到下一个节点（不换行）
      Enter: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;

        if ($from.parent.type.name === "title") {
          // 移动到 title 节点之后的第一个内容位置
          const titleNodeSize = editor.state.doc.firstChild?.nodeSize || 0;
          editor.commands.focus(titleNodeSize + 1);
          return true;
        }
        return false;
      },

      // 在 title 节点中按 ArrowDown 应该跳到下一个节点
      ArrowDown: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;

        if ($from.parent.type.name === "title") {
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
          // 如果光标在 title 节点内的开头，不阻止（让默认行为处理）
          if ($from.parent.type.name === "title") {
            return false;
          }

          const doc = editor.state.doc;
          const titleNode = doc.firstChild;

          if (titleNode && titleNode.type.name === "title") {
            const afterTitlePos = titleNode.nodeSize;

            try {
              const nodeBeforePos = $from.before($from.depth);
              if (nodeBeforePos === afterTitlePos) {
                // 完全阻止左移，不进入 title
                return true;
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

      // 从第一个内容节点通过上键移动到 title 节点末尾
      ArrowUp: ({ editor }) => {
        const { selection } = editor.state;
        const { $from, empty } = selection;

        // 如果在 title 节点中，不处理（已在顶部）
        if ($from.parent.type.name === "title") {
          return true; // 阻止上移，已在顶部
        }

        if (empty) {
          const doc = editor.state.doc;
          const titleNode = doc.firstChild;

          if (titleNode && titleNode.type.name === "title") {
            const afterTitlePos = titleNode.nodeSize;

            try {
              const nodeBeforePos = $from.before($from.depth);
              if (nodeBeforePos === afterTitlePos) {
                // 对于多行节点（如 codeBlock），检查光标是否在第一行
                // 通过检查光标前的文本是否包含换行符来判断
                const nodeStart = $from.start($from.depth);
                const textBeforeCursor = doc.textBetween(nodeStart, $from.pos);

                // 如果光标前有换行符，说明不在第一行，让默认行为处理
                if (textBeforeCursor.includes("\n")) {
                  return false;
                }

                // 在第一行，移动到 title 节点的末尾
                editor.commands.focus(titleNode.nodeSize - 1);
                return true;
              }
            } catch {
              if ($from.pos <= afterTitlePos + 1) {
                editor.commands.focus(titleNode.nodeSize - 1);
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
