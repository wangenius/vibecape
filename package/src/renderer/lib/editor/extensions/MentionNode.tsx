/**
 * Tiptap Mention 扩展
 * 用于 @角色 提及功能
 */

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";

export interface MentionOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mention: {
      setMention: (attrs: { id: string; label?: string }) => ReturnType;
    };
  }
}

export const MentionNode = Node.create<MentionOptions>({
  name: "mention",

  group: "inline",

  inline: true,

  selectable: false,

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
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-label"),
        renderHTML: (attributes) => {
          if (!attributes.label) {
            return {};
          }
          return {
            "data-label": attributes.label,
          };
        },
      },
      mentionType: {
        default: "actant",
        parseHTML: (element) => element.getAttribute("data-mention-type"),
        renderHTML: (attributes) => {
          if (!attributes.mentionType) {
            return {};
          }
          return {
            "data-mention-type": attributes.mentionType,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="mention"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        { "data-type": "mention" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      `@${node.attrs.label || node.attrs.id}`,
    ];
  },

  addCommands() {
    return {
      setMention:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MentionComponent);
  },
});

// React 组件用于渲染 Mention - Notion 风格
function MentionComponent(props: any) {
  const mentionType = props.node.attrs.mentionType || "actant";

  // 根据类型设置不同的样式 - Notion 风格
  const getTypeStyles = () => {
    switch (mentionType) {
      case "story":
        return "text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-500/10 hover:bg-blue-100/80 dark:hover:bg-blue-500/20";
      case "actant":
        return "text-violet-700 dark:text-violet-400 bg-violet-50/80 dark:bg-violet-500/10 hover:bg-violet-100/80 dark:hover:bg-violet-500/20";
      case "lore":
        return "text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-500/10 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/20";
      default:
        return "text-zinc-700 dark:text-zinc-400 bg-zinc-50/80 dark:bg-zinc-500/10 hover:bg-zinc-100/80 dark:hover:bg-zinc-500/20";
    }
  };

  return (
    <NodeViewWrapper
      as="span"
      className={`mention inline-flex items-center px-1.5 py-0.5 rounded-md text-sm font-medium transition-all cursor-pointer select-none mx-0.5 ${getTypeStyles()}`}
      data-type="mention"
      data-id={props.node.attrs.id}
      data-mention-type={mentionType}
    >
      <span className="opacity-50 mr-0.5 font-normal text-xs">@</span>
      {props.node.attrs.label || props.node.attrs.id}
    </NodeViewWrapper>
  );
}
