import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";

// Admonition 类型定义
type AdmonitionType = "info" | "warning" | "danger" | "tip" | "note";

const typeStyles: Record<AdmonitionType, { bg: string; border: string; icon: string }> = {
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "ℹ️",
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
    icon: "⚠️",
  },
  danger: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    icon: "🚨",
  },
  tip: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    icon: "💡",
  },
  note: {
    bg: "bg-gray-50 dark:bg-gray-950/30",
    border: "border-gray-200 dark:border-gray-800",
    icon: "📝",
  },
};

// React 组件渲染 Admonition
const AdmonitionComponent = ({ node }: { node: any }) => {
  const type = (node.attrs.type as AdmonitionType) || "info";
  const title = node.attrs.title || type.charAt(0).toUpperCase() + type.slice(1);
  const style = typeStyles[type] || typeStyles.info;

  return (
    <NodeViewWrapper>
      <div
        className={`my-4 rounded-lg border-l-4 p-4 ${style.bg} ${style.border}`}
        contentEditable={false}
      >
        <div className="flex items-center gap-2 font-medium mb-2">
          <span>{style.icon}</span>
          <span>{title}</span>
        </div>
        <div className="text-sm opacity-90">{node.attrs.content}</div>
      </div>
    </NodeViewWrapper>
  );
};

// 自定义 Admonition 扩展
export const AdmonitionExtension = Node.create({
  name: "admonition",
  group: "block",
  content: "inline*",
  atom: true,

  addAttributes() {
    return {
      type: {
        default: "info",
      },
      title: {
        default: "",
      },
      content: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-admonition]",
        getAttrs: (dom) => {
          const element = dom as HTMLElement;
          return {
            type: element.getAttribute("data-type") || "info",
            title: element.getAttribute("data-title") || "",
            content: element.textContent || "",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-admonition": "true",
        "data-type": HTMLAttributes.type,
        "data-title": HTMLAttributes.title,
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AdmonitionComponent);
  },
});

// 输入规则：匹配 :::type title="xxx" 格式
export const admonitionInputRegex = /^:::(\w+)(?:\s+title="([^"]*)")?[\s\n]/;

// Markdown 解析辅助函数
export function parseAdmonitionFromMarkdown(text: string): {
  type: string;
  title: string;
  content: string;
} | null {
  const match = text.match(/^:::(\w+)(?:\s+title="([^"]*)")?\n([\s\S]*?):::$/);
  if (match) {
    return {
      type: match[1],
      title: match[2] || "",
      content: match[3].trim(),
    };
  }
  return null;
}
