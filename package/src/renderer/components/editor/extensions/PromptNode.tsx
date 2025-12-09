/**
 * Prompt Node 扩展
 * 用于 #prompt 快速插入功能
 * 在编辑器中显示为标题标签，提交时转换为实际文本
 */

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { TbPrompt } from "react-icons/tb";

export interface PromptNodeOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    promptNode: {
      setPromptNode: (attrs: { id: string; title: string }) => ReturnType;
    };
  }
}

export const PromptNode = Node.create<PromptNodeOptions>({
  name: "promptNode",

  group: "inline",

  inline: true,

  selectable: true,

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
        parseHTML: (element) => element.getAttribute("data-prompt-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }
          return {
            "data-prompt-id": attributes.id,
          };
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-prompt-title"),
        renderHTML: (attributes) => {
          if (!attributes.title) {
            return {};
          }
          return {
            "data-prompt-title": attributes.title,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="prompt-node"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        { "data-type": "prompt-node" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      `#${node.attrs.title || node.attrs.id}`,
    ];
  },

  addCommands() {
    return {
      setPromptNode:
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
    return ReactNodeViewRenderer(PromptNodeComponent);
  },
});

// React 组件用于渲染 PromptNode
function PromptNodeComponent(props: any) {
  return (
    <NodeViewWrapper
      as="span"
      className="prompt-node inline-flex items-center px-1.5 py-0.5 rounded-md text-sm font-medium transition-all cursor-pointer select-none mx-0.5 text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-500/10 hover:bg-amber-100/80 dark:hover:bg-amber-500/20"
      data-type="prompt-node"
      data-prompt-id={props.node.attrs.id}
    >
      <TbPrompt className="size-3 mr-1 opacity-70" />
      {props.node.attrs.title || props.node.attrs.id}
    </NodeViewWrapper>
  );
}
