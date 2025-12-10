/**
 * Tiptap Predict 扩展
 * 用于 AI 预测文本功能
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';

export interface PredictOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    predict: {
      insertPredict: (id: string, text?: string) => ReturnType;
      updatePredict: (id: string, text: string) => ReturnType;
      removePredict: () => ReturnType;
    };
  }
}

// 全局存储当前预测文本
let currentPredictText = '';

export const getPredictText = () => currentPredictText;

export const PredictNode = Node.create<PredictOptions>({
  name: 'predict',

  group: 'inline',

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
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {};
          }
          return {
            'data-id': attributes.id,
          };
        },
      },
      text: {
        default: '',
        parseHTML: element => element.textContent,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="predict"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': 'predict' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      node.attrs.text,
    ];
  },

  addCommands() {
    return {
      insertPredict:
        (id: string, text = '') =>
        ({ commands, state: _state }) => {
          currentPredictText = text;
          return commands.insertContent({
            type: this.name,
            attrs: { id, text },
          });
        },

      updatePredict:
        (id: string, text: string) =>
        ({ state, tr }) => {
          currentPredictText = text;
          let found = false;

          state.doc.descendants((node, pos) => {
            if (node.type.name === 'predict' && node.attrs.id === id) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, text });
              found = true;
              return false;
            }
            return true;
          });

          return found;
        },

      removePredict:
        () =>
        ({ state, tr }) => {
          currentPredictText = '';
          let found = false;

          state.doc.descendants((node, pos) => {
            if (node.type.name === 'predict') {
              tr.delete(pos, pos + node.nodeSize);
              found = true;
              return false;
            }
            return true;
          });

          return found;
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(PredictComponent);
  },
});

// React 组件用于渲染 Predict
function PredictComponent(props: any) {
  return (
    <NodeViewWrapper
      as="span"
      className="predict text-gray-400 dark:text-gray-500 italic"
      data-type="predict"
      data-id={props.node.attrs.id}
    >
      {props.node.attrs.text}
    </NodeViewWrapper>
  );
}
