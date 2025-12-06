/**
 * RefExtension - ChatInput 专用引用扩展
 *
 * 支持两种引用类型：
 * 1. docRef - 文档引用：引用整个文档
 * 2. textRef - 选区引用：引用特定文本片段
 *
 * JSONContent 格式：
 * {
 *   type: "docRef",
 *   attrs: { docId: string, docTitle: string }
 * }
 * {
 *   type: "textRef",
 *   attrs: { docId?: string, docTitle?: string, text: string }
 * }
 *
 * 解析为纯文本格式：
 * - docRef: [REF:DOC:id:title]
 * - textRef: [REF:TEXT:id:title]...内容...[/REF:TEXT]
 */

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  ReactRenderer,
} from "@tiptap/react";
import { NodeViewProps } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import tippy, { Instance as TippyInstance } from "tippy.js";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import { FileText, Quote, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocTreeNode } from "@common/schema/docs";
import PinyinMatch from "pinyin-match";
import { useMentionHistoryStore } from "@/hooks/stores/useMentionHistoryStore";
import { useDocumentStore } from "@/hooks/stores/useDocumentStore";

// =============================================================================
// 类型定义
// =============================================================================

export interface RefItem {
  id: string;
  title: string;
  type: "doc" | "text";
  text?: string; // 仅 textRef 有
}

interface RefMenuProps {
  items: RefItem[];
  command: (item: RefItem) => void;
  isLoading?: boolean;
}

interface RefMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

// =============================================================================
// DocRef Node - 文档引用节点
// =============================================================================

const DocRefComponent = ({ node }: NodeViewProps) => {
  const docTitle = node.attrs.docTitle;

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500 text-sm cursor-default"
        contentEditable={false}
      >
        <FileText className="size-3" />
        <span>{docTitle || "未知文档"}</span>
      </span>
    </NodeViewWrapper>
  );
};

export const DocRefNode = Node.create({
  name: "docRef",
  group: "inline",
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      docId: { default: null },
      docTitle: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="doc-ref"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes({ "data-type": "doc-ref" }, HTMLAttributes),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocRefComponent);
  },
});

// =============================================================================
// TextRef Node - 选区引用节点
// =============================================================================

const TextRefComponent = ({ node, deleteNode }: NodeViewProps) => {
  const { docTitle } = node.attrs;

  return (
    <NodeViewWrapper as="span" className="inline mx-0.5">
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-600 text-sm cursor-default align-middle border border-orange-500/20"
        contentEditable={false}
      >
        <Quote className="size-3" />
        <span className="max-w-[120px] truncate">
          {docTitle || "未知文档"}
        </span>
        <button
          onClick={deleteNode}
          className="ml-0.5 p-0.5 rounded hover:bg-orange-500/20 text-orange-600/70 hover:text-orange-600 transition-colors"
        >
          <X className="size-3" />
        </button>
      </span>
    </NodeViewWrapper>
  );
};

export const TextRefNode = Node.create({
  name: "textRef",
  group: "inline",
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      docId: { default: null },
      docTitle: { default: null },
      text: { default: "" },
      // 增强的位置和上下文信息
      position: { default: null }, // { from: number, to: number }
      context: { default: null }, // { before: string, after: string }
      paragraph: { default: null }, // 所在段落文本
      paragraphOffset: { default: null }, // 在段落中的偏移
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="text-ref"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes({ "data-type": "text-ref" }, HTMLAttributes),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TextRefComponent);
  },
});

// =============================================================================
// RefMenu Component - @ 触发的文档选择菜单
// =============================================================================

const RefMenuComponent = forwardRef<RefMenuRef, RefMenuProps>(
  ({ items, command, isLoading }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) command(item);
      },
      [items, command]
    );

    const onKeyDown = useCallback(
      ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
          return true;
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
          return true;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
      [items.length, selectedIndex, selectItem]
    );

    useImperativeHandle(ref, () => ({ onKeyDown }), [onKeyDown]);

    if (isLoading) {
      return (
        <div className="bg-background border border-border rounded-2xl overflow-hidden w-56 py-3 px-3 text-sm text-muted-foreground">
          加载中...
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="bg-background border border-border rounded-2xl overflow-hidden w-56 py-3 px-3 text-sm text-muted-foreground">
          未找到文档
        </div>
      );
    }

    return (
      <div
        className="bg-background border border-border rounded-2xl overflow-hidden w-56 max-h-80 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide select-none">
          引用文档
        </div>
        <div className="px-1">
          {items.map((item, index) => (
            <button
              key={item.id}
              className={cn(
                "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-all duration-100 group outline-none",
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-accent/50"
              )}
              onClick={() => selectItem(index)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center justify-center size-6 rounded-md transition-colors shrink-0 text-blue-500">
                <FileText className="size-4" />
              </div>
              <span className="text-xs font-normal truncate block leading-tight">
                {item.title || "无标题"}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }
);

RefMenuComponent.displayName = "RefMenuComponent";

// =============================================================================
// RefCommand Extension - @ 触发文档引用
// =============================================================================

function flattenDocTree(nodes: DocTreeNode[]): RefItem[] {
  const result: RefItem[] = [];
  function traverse(items: DocTreeNode[]) {
    for (const item of items) {
      result.push({ id: item.id, title: item.title, type: "doc" });
      if (item.children?.length) traverse(item.children);
    }
  }
  traverse(nodes);
  return result;
}

export const RefCommand = Node.create({
  name: "refCommand",
  group: "inline",
  inline: true,
  selectable: false,
  atom: true,

  addProseMirrorPlugins() {
    let cachedDocs: RefItem[] = [];

    const fetchDocs = async () => {
      try {
        const api = (window as any).api?.vibecape;
        if (api?.getTree) {
          const tree = await api.getTree();
          cachedDocs = flattenDocTree(tree);
        }
      } catch (err) {
        console.error("Failed to fetch docs for ref:", err);
      }
    };

    const getSortedDocs = (docs: RefItem[]): RefItem[] => {
      const activeDocId = useDocumentStore.getState().activeDocId;
      const { getScore } = useMentionHistoryStore.getState();

      return [...docs].sort((a, b) => {
        const scoreA = getScore(a.id, activeDocId);
        const scoreB = getScore(b.id, activeDocId);
        return scoreB - scoreA;
      });
    };

    const recordRef = (id: string, title: string) => {
      useMentionHistoryStore.getState().recordMention(id, title);
    };

    fetchDocs();

    return [
      Suggestion({
        editor: this.editor,
        pluginKey: new PluginKey("refSuggestion"),
        char: "@",
        items: ({ query }) => {
          fetchDocs();

          let filtered = cachedDocs;
          if (query) {
            filtered = cachedDocs.filter((doc) => {
              if (doc.title.toLowerCase().includes(query.toLowerCase()))
                return true;
              const match = PinyinMatch.match(doc.title, query);
              return match !== false;
            });
          }

          return getSortedDocs(filtered).slice(0, 10);
        },
        render: () => {
          let popup: TippyInstance[] | null = null;
          let component: ReactRenderer;

          return {
            onStart: (props) => {
              component = new ReactRenderer(RefMenuComponent, {
                props: {
                  items: props.items,
                  command: (item: RefItem) => {
                    recordRef(item.id, item.title);
                    props.editor
                      .chain()
                      .focus()
                      .deleteRange(props.range)
                      .insertContent({
                        type: "docRef",
                        attrs: { docId: item.id, docTitle: item.title },
                      })
                      .run();
                    popup?.[0]?.hide();
                  },
                },
                editor: props.editor,
              });

              popup = tippy("body", {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
                maxWidth: "none",
              });
            },

            onUpdate(props) {
              component.updateProps({
                items: props.items,
                command: (item: RefItem) => {
                  recordRef(item.id, item.title);
                  props.editor
                    .chain()
                    .focus()
                    .deleteRange(props.range)
                    .insertContent({
                      type: "docRef",
                      attrs: { docId: item.id, docTitle: item.title },
                    })
                    .run();
                  popup?.[0]?.hide();
                },
              });

              if (popup?.[0]) {
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                });
              }
            },

            onKeyDown(props) {
              if (props.event.key === "Escape") {
                popup?.[0]?.hide();
                return true;
              }
              const ref = component?.ref as RefMenuRef | null;
              return ref?.onKeyDown(props) || false;
            },

            onExit() {
              popup?.[0]?.destroy();
              component?.destroy();
              popup = null;
            },
          };
        },
      }),
    ];
  },
});

// =============================================================================
// 导出 - RefExtension 包含所有引用相关节点
// =============================================================================

export const RefExtension = [DocRefNode, TextRefNode, RefCommand];

// =============================================================================
// 工具函数 - 将 JSONContent 转换为可解析的纯文本格式
// =============================================================================

/**
 * 将包含 Ref 节点的 Tiptap JSONContent 转换为纯文本
 *
 * 简洁格式：
 * - docRef: [REF]{"type":"doc","docId":"...","docTitle":"..."}[/REF]
 * - textRef: [REF]{"type":"text","docId":"...","text":"...","position":{...},...}[/REF]
 */
export const refContentToText = (json: any): string => {
  const parts: string[] = [];

  const processNode = (node: any): string => {
    if (!node) return "";

    // DocRef 节点
    if (node.type === "docRef") {
      const refData = {
        type: "doc",
        docId: node.attrs?.docId,
        docTitle: node.attrs?.docTitle,
      };
      return `[REF]${JSON.stringify(refData)}[/REF]`;
    }

    // TextRef 节点
    if (node.type === "textRef") {
      const { docId, docTitle, text, position, context, paragraph } =
        node.attrs || {};
      const refData = {
        type: "text",
        docId,
        docTitle,
        text,
        position,
        context,
        paragraph,
      };
      // 移除 undefined 字段
      Object.keys(refData).forEach(
        (key) =>
          refData[key as keyof typeof refData] === undefined &&
          delete refData[key as keyof typeof refData]
      );
      return `[REF]${JSON.stringify(refData)}[/REF]`;
    }

    // 文本节点
    if (node.type === "text") {
      return node.text || "";
    }

    // 其他节点 - 递归处理
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(processNode).join("");
    }

    return "";
  };

  if (json.content) {
    for (const node of json.content) {
      const text = processNode(node);
      if (text) parts.push(text);
    }
  }

  return parts.join("\n");
};

/**
 * 插入选区引用到编辑器
 * 支持完整的 QuoteEventDetail 或简单参数
 */
export interface TextRefOptions {
  text: string;
  docId?: string;
  docTitle?: string;
  position?: { from: number; to: number };
  context?: { before: string; after: string };
  paragraph?: string;
  paragraphOffset?: number;
}

export const insertTextRef = (
  editor: any,
  textOrOptions: string | TextRefOptions,
  docId?: string,
  docTitle?: string
) => {
  // 兼容旧的调用方式
  const attrs =
    typeof textOrOptions === "string"
      ? { text: textOrOptions, docId, docTitle }
      : {
          text: textOrOptions.text,
          docId: textOrOptions.docId,
          docTitle: textOrOptions.docTitle,
          position: textOrOptions.position,
          context: textOrOptions.context,
          paragraph: textOrOptions.paragraph,
          paragraphOffset: textOrOptions.paragraphOffset,
        };

  editor
    .chain()
    .focus()
    .insertContent({
      type: "textRef",
      attrs,
    })
    .run();
};
