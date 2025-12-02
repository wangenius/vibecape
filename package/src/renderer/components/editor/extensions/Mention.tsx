/**
 * Mention 扩展
 * 通过 @ 提及其他文档
 */

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, ReactRenderer } from "@tiptap/react";
import { NodeViewProps } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { forwardRef, useCallback, useImperativeHandle, useState, useEffect } from "react";
import { TbScript } from "react-icons/tb";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocTreeNode } from "@common/schema/docs";
import PinyinMatch from "pinyin-match";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    docMention: {
      insertDocMention: (id: string, title: string) => ReturnType;
    };
  }
}

// Mention 节点组件
const MentionComponent = ({ node }: NodeViewProps) => {
  const title = node.attrs.title || "未知文档";
  const docId = node.attrs.id;
  const [open, setOpen] = useState(false);
  const [docInfo, setDocInfo] = useState<{ title: string; description: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取文档详情
  const fetchDocInfo = useCallback(async () => {
    if (!docId || docInfo) return;
    setLoading(true);
    try {
      const api = (window as any).api?.vibecape;
      if (api?.getDoc) {
        const doc = await api.getDoc(docId);
        setDocInfo({
          title: doc.title || "无标题",
          description: doc.metadata?.description || "暂无描述",
        });
      }
    } catch (err) {
      console.error("Failed to fetch doc info:", err);
      setDocInfo({ title, description: "无法加载文档信息" });
    } finally {
      setLoading(false);
    }
  }, [docId, docInfo, title]);

  // 打开 Popover 时加载文档信息
  useEffect(() => {
    if (open) {
      fetchDocInfo();
    }
  }, [open, fetchDocInfo]);

  const handleNavigate = useCallback(() => {
    setOpen(false);
    // 触发文档跳转事件
    const event = new CustomEvent("doc:navigate", {
      detail: { id: docId },
    });
    window.dispatchEvent(event);
  }, [docId]);

  return (
    <NodeViewWrapper as="span" className="inline">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-sm cursor-pointer hover:bg-primary/20 transition-colors"
            contentEditable={false}
          >
            <TbScript className="size-3" />
            <span>{title}</span>
          </span>
        </PopoverTrigger>
        <PopoverContent 
          className="w-72 p-0" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">加载中...</div>
          ) : docInfo ? (
            <div className="flex flex-col">
              <div className="p-3 border-b border-border">
                <h4 className="font-medium text-sm leading-tight mb-1">
                  {docInfo.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {docInfo.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="m-1 justify-start gap-2"
                onClick={handleNavigate}
              >
                <ExternalLink className="size-3.5" />
                打开文档
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
};

// Mention 选择菜单
interface MentionMenuItem {
  id: string;
  title: string;
}

interface MentionMenuProps {
  items: MentionMenuItem[];
  command: (item: MentionMenuItem) => void;
}

interface MentionMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const MentionMenuComponent = forwardRef<MentionMenuRef, MentionMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) {
          command(item);
        }
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
          文档
        </div>
        <div className="px-1">
          {items.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={item.id}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-all duration-100 group outline-none",
                  isSelected
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent/50"
                )}
                onClick={() => selectItem(index)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center justify-center size-6 rounded-md transition-colors shrink-0 text-blue-500">
                  <TbScript className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "text-xs font-normal truncate block leading-tight",
                      isSelected ? "text-accent-foreground" : "text-foreground"
                    )}
                  >
                    {item.title || "无标题"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

MentionMenuComponent.displayName = "MentionMenuComponent";

// 扁平化文档树
function flattenDocTree(nodes: DocTreeNode[]): MentionMenuItem[] {
  const result: MentionMenuItem[] = [];
  
  function traverse(items: DocTreeNode[]) {
    for (const item of items) {
      result.push({ id: item.id, title: item.title });
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    }
  }
  
  traverse(nodes);
  return result;
}

export const Mention = Node.create({
  name: "mention",

  group: "inline",

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => ({
          "data-id": attributes.id,
        }),
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-title"),
        renderHTML: (attributes) => ({
          "data-title": attributes.title,
        }),
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

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes({ "data-type": "mention" }, HTMLAttributes),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MentionComponent);
  },

  addCommands() {
    return {
      insertDocMention:
        (id: string, title: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { id, title },
          });
        },
    };
  },

  addProseMirrorPlugins() {
    const nodeType = this.type;
    let cachedDocs: MentionMenuItem[] = [];

    // 获取文档列表
    const fetchDocs = async () => {
      try {
        const api = (window as any).api?.vibecape;
        if (api?.getTree) {
          const tree = await api.getTree();
          cachedDocs = flattenDocTree(tree);
        }
      } catch (err) {
        console.error("Failed to fetch docs for mention:", err);
      }
    };

    // 初始加载
    fetchDocs();

    return [
      Suggestion({
        editor: this.editor,
        pluginKey: new PluginKey("mentionSuggestion"),
        char: "@",
        items: ({ query }) => {
          // 刷新文档列表
          fetchDocs();
          
          if (!query) {
            return cachedDocs.slice(0, 10);
          }
          
          return cachedDocs.filter((doc) => {
            // 普通文本匹配
            if (doc.title.toLowerCase().includes(query.toLowerCase())) {
              return true;
            }
            // 拼音匹配
            const match = PinyinMatch.match(doc.title, query);
            return match !== false;
          }).slice(0, 10);
        },
        render: () => {
          let popup: TippyInstance[] | null = null;
          let component: ReactRenderer;

          return {
            onStart: (props) => {
              component = new ReactRenderer(MentionMenuComponent, {
                props: {
                  items: props.items,
                  command: (item: MentionMenuItem) => {
                    props.editor
                      .chain()
                      .focus()
                      .deleteRange(props.range)
                      .insertContent({
                        type: nodeType.name,
                        attrs: { id: item.id, title: item.title },
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
                command: (item: MentionMenuItem) => {
                  props.editor
                    .chain()
                    .focus()
                    .deleteRange(props.range)
                    .insertContent({
                      type: nodeType.name,
                      attrs: { id: item.id, title: item.title },
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
              const ref = component?.ref as MentionMenuRef | null;
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
