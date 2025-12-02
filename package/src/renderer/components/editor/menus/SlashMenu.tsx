/**
 * Slash Menu 组件
 * 输入 / 时弹出的命令菜单
 */

import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { useCallback, useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import { Editor } from "@tiptap/core";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Wand2,
  Sparkles,
} from "lucide-react";

export type SlashMenuCategory = "ai" | "heading" | "list" | "insert";

export interface SlashMenuItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  category: SlashMenuCategory;
  command: ({ editor, range }: { editor: Editor; range: any }) => void;
}

const getCategoryLabel = (category: SlashMenuCategory) => {
  switch (category) {
    case "ai":
      return "AI";
    case "heading":
      return "标题";
    case "list":
      return "列表";
    case "insert":
      return "插入";
  }
};

const getCategoryColor = (category: SlashMenuCategory) => {
  switch (category) {
    case "ai":
      return "text-violet-600 dark:text-violet-400";
    case "heading":
      return "text-blue-600 dark:text-blue-400";
    case "list":
      return "text-emerald-600 dark:text-emerald-400";
    case "insert":
      return "text-orange-600 dark:text-orange-400";
  }
};

export const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  {
    title: "AI 改写",
    description: "使用 AI 改写或生成内容",
    icon: <Wand2 className="size-4" />,
    category: "ai",
    command: ({ editor }) => {
      editor.chain().focus().insertAIRewrite().run();
    },
  },
  {
    title: "AI 续写",
    description: "AI 帮你续写内容",
    icon: <Sparkles className="size-4" />,
    category: "ai",
    command: ({ editor }) => {
      editor.chain().focus().run();
      const event = new CustomEvent("tiptap:ai-continue", {
        detail: { editor },
      });
      window.dispatchEvent(event);
    },
  },
  {
    title: "一级标题",
    description: "大标题",
    icon: <Heading1 className="size-4" />,
    category: "heading",
    command: ({ editor }) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    },
  },
  {
    title: "二级标题",
    description: "中标题",
    icon: <Heading2 className="size-4" />,
    category: "heading",
    command: ({ editor }) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: "三级标题",
    description: "小标题",
    icon: <Heading3 className="size-4" />,
    category: "heading",
    command: ({ editor }) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  {
    title: "无序列表",
    description: "创建无序列表",
    icon: <List className="size-4" />,
    category: "list",
    command: ({ editor }) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    title: "有序列表",
    description: "创建有序列表",
    icon: <ListOrdered className="size-4" />,
    category: "list",
    command: ({ editor }) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    title: "待办列表",
    description: "创建待办列表",
    icon: <CheckSquare className="size-4" />,
    category: "list",
    command: ({ editor }) => {
      editor.chain().focus().toggleTaskList().run();
    },
  },
  {
    title: "引用",
    description: "创建引用块",
    icon: <Quote className="size-4" />,
    category: "insert",
    command: ({ editor }) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  {
    title: "代码块",
    description: "创建代码块",
    icon: <Code className="size-4" />,
    category: "insert",
    command: ({ editor }) => {
      editor.chain().focus().toggleCodeBlock().run();
    },
  },
  {
    title: "分割线",
    description: "插入分割线",
    icon: <Minus className="size-4" />,
    category: "insert",
    command: ({ editor }) => {
      editor.chain().focus().setHorizontalRule().run();
    },
  },
];

interface SlashMenuProps {
  items: SlashMenuItem[];
  command: (item: SlashMenuItem) => void;
}

export interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const SlashMenuComponent = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    // 滚动到选中项
    useEffect(() => {
      const selectedItem = itemRefs.current[selectedIndex];
      if (selectedItem && containerRef.current) {
        selectedItem.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }, [selectedIndex]);

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
          setSelectedIndex((prev) => {
            const newIndex = prev > 0 ? prev - 1 : items.length - 1;
            return newIndex;
          });
          return true;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSelectedIndex((prev) => {
            const newIndex = prev < items.length - 1 ? prev + 1 : 0;
            return newIndex;
          });
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

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown,
      }),
      [onKeyDown]
    );

    // 按类别分组
    const groupedItems = items.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<SlashMenuCategory, SlashMenuItem[]>
    );

    const allGroupedItems: Array<{ category: SlashMenuCategory; items: SlashMenuItem[] }> = [];
    (["ai", "heading", "list", "insert"] as SlashMenuCategory[]).forEach((category) => {
      if (groupedItems[category] && groupedItems[category].length > 0) {
        allGroupedItems.push({ category, items: groupedItems[category] });
      }
    });

    // 计算全局索引
    const getGlobalIndex = (groupIndex: number, itemIndex: number): number => {
      let globalIndex = 0;
      for (let i = 0; i < groupIndex; i++) {
        globalIndex += allGroupedItems[i].items.length;
      }
      return globalIndex + itemIndex;
    };

    return (
      <div
        ref={containerRef}
        className="bg-background border border-border rounded-2xl overflow-hidden w-56 max-h-80 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-none"
        style={{
          scrollbarWidth: "none",
        }}
      >
        {items.length > 0 ? (
          <div className="flex flex-col">
            {allGroupedItems.map((group, groupIndex) => (
              <div key={group.category}>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide select-none">
                  {getCategoryLabel(group.category)}
                </div>
                <div className="px-1">
                  {group.items.map((item, itemIndex) => {
                    const globalIndex = getGlobalIndex(groupIndex, itemIndex);
                    const isSelected = globalIndex === selectedIndex;
                    return (
                      <button
                        key={globalIndex}
                        ref={(el) => (itemRefs.current[globalIndex] = el)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-all duration-100 group outline-none",
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-accent/50"
                        )}
                        onClick={() => selectItem(globalIndex)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center size-6 rounded-md transition-colors shrink-0",
                            getCategoryColor(item.category)
                          )}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "text-xs font-normal truncate block leading-tight",
                              isSelected
                                ? "text-accent-foreground"
                                : "text-foreground"
                            )}
                          >
                            {item.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-3 py-6 text-sm text-muted-foreground text-center">
            未找到匹配的命令
          </div>
        )}
      </div>
    );
  }
);

SlashMenuComponent.displayName = "SlashMenuComponent";

export const createSlashMenuPlugin = () => {
  let popup: TippyInstance[] | null = null;

  return {
    char: "/",
    
    items: ({ query }: { query: string }) => {
      return SLASH_MENU_ITEMS.filter((item) => {
        const searchStr = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(searchStr) ||
          item.description.toLowerCase().includes(searchStr)
        );
      });
    },

    render: () => {
      let localComponent: ReactRenderer;

      return {
        onStart: (props: any) => {
          
          localComponent = new ReactRenderer(SlashMenuComponent, {
            props: {
              items: props.items,
              command: (item: SlashMenuItem) => {
                // 删除 / 字符和查询文本
                props.editor
                  .chain()
                  .focus()
                  .deleteRange(props.range)
                  .run();

                // 执行命令，传递 editor 和 range
                item.command({ editor: props.editor, range: props.range });
                
                // 关闭菜单
                popup?.[0]?.hide();
              },
            },
            editor: props.editor,
          });

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: localComponent.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
            maxWidth: "none",
          });
        },

        onUpdate(props: any) {
          localComponent.updateProps({
            items: props.items,
            command: (item: SlashMenuItem) => {
              props.editor
                .chain()
                .focus()
                .deleteRange(props.range)
                .run();

              item.command({ editor: props.editor, range: props.range });
              popup?.[0]?.hide();
            },
          });

          if (popup && popup[0]) {
            popup[0].setProps({
              getReferenceClientRect: props.clientRect,
            });
          }
        },

        onKeyDown(props: any) {
          if (props.event.key === "Escape") {
            popup?.[0]?.hide();
            return true;
          }

          const ref = localComponent?.ref as SlashMenuRef | null;
          return ref?.onKeyDown(props) || false;
        },

        onExit() {
          popup?.[0]?.destroy();
          localComponent?.destroy();
          popup = null;
        },
      };
    },
  };
};

