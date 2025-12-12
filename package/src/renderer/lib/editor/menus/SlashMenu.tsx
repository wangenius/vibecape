/**
 * Slash Menu 组件
 * 输入 / 时弹出的命令菜单
 */

import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance as TippyInstance } from "tippy.js";
import {
  useCallback,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { Editor } from "@tiptap/core";
import { cn } from "@/lib/utils";
import PinyinMatch from "pinyin-match";
import { lockScroll, unlockScroll } from "@/lib/editor/scroll-lock";
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
  MessageCircle,
  Lightbulb,
  Info,
  AlertTriangle,
  AlertCircle,
  ImageIcon,
  Link2,
  Table,
} from "lucide-react";

export type SlashMenuCategory = "ai" | "heading" | "list" | "insert";

export interface SlashMenuItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  category: SlashMenuCategory;
  command: ({ editor, range }: { editor: Editor; range: any }) => void;
}

const getCategoryLabel = (category: SlashMenuCategory, t: any) => {
  switch (category) {
    case "ai":
      return t("common.slashMenu.category.ai");
    case "heading":
      return t("common.slashMenu.category.heading");
    case "list":
      return t("common.slashMenu.category.list");
    case "insert":
      return t("common.slashMenu.category.insert");
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

export const getSlashMenuItems = (t: any): SlashMenuItem[] => [
  {
    title: t("common.slashMenu.aiRewrite"),
    description: t("common.slashMenu.aiRewriteDesc"),
    icon: <Wand2 className="size-4" />,
    category: "ai",
    command: ({ editor }) => {
      editor.chain().focus().insertDocAIPrompt().run();
    },
  },
  {
    title: t("common.slashMenu.h1"),
    description: t("common.slashMenu.h1Desc"),
    icon: <Heading1 className="size-4" />,
    category: "heading",
    command: ({ editor }) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    },
  },
  {
    title: t("common.slashMenu.h2"),
    description: t("common.slashMenu.h2Desc"),
    icon: <Heading2 className="size-4" />,
    category: "heading",
    command: ({ editor }) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: t("common.slashMenu.h3"),
    description: t("common.slashMenu.h3Desc"),
    icon: <Heading3 className="size-4" />,
    category: "heading",
    command: ({ editor }) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  {
    title: t("common.slashMenu.bulletList"),
    description: t("common.slashMenu.bulletListDesc"),
    icon: <List className="size-4" />,
    category: "list",
    command: ({ editor }) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    title: t("common.slashMenu.orderedList"),
    description: t("common.slashMenu.orderedListDesc"),
    icon: <ListOrdered className="size-4" />,
    category: "list",
    command: ({ editor }) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    title: t("common.slashMenu.taskList"),
    description: t("common.slashMenu.taskListDesc"),
    icon: <CheckSquare className="size-4" />,
    category: "list",
    command: ({ editor }) => {
      editor.chain().focus().toggleTaskList().run();
    },
  },
  {
    title: t("common.slashMenu.quote"),
    description: t("common.slashMenu.quoteDesc"),
    icon: <Quote className="size-4" />,
    category: "insert",
    command: ({ editor }) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  {
    title: t("common.slashMenu.codeBlock"),
    description: t("common.slashMenu.codeBlockDesc"),
    icon: <Code className="size-4" />,
    category: "insert",
    command: ({ editor }) => {
      editor.chain().focus().toggleCodeBlock().run();
    },
  },
  {
    title: t("common.slashMenu.divider"),
    description: t("common.slashMenu.dividerDesc"),
    icon: <Minus className="size-4" />,
    category: "insert",
    command: ({ editor }) => {
      editor.chain().focus().setHorizontalRule().run();
    },
  },
  {
    title: t("common.slashMenu.note"),
    description: t("common.slashMenu.noteDesc"),
    icon: <MessageCircle className="size-4" />,
    category: "insert",
    command: ({ editor }) => {
      editor.chain().focus().setAdmonition("note").run();
    },
  },
  {
    title: t("common.slashMenu.tip"),
    description: t("common.slashMenu.tipDesc"),
    icon: <Lightbulb className="size-4" />,
    category: "insert",
    command: ({ editor }) => {
      editor.chain().focus().setAdmonition("tip").run();
    },
  },
  {
    title: t("common.slashMenu.info"),
    description: t("common.slashMenu.infoDesc"),
    icon: <Info className="size-4" />,
    category: "insert",
    command: ({ editor }) => {
      editor.chain().focus().setAdmonition("info").run();
    },
  },
  {
    title: t("common.slashMenu.warning"),
    description: t("common.slashMenu.warningDesc"),
    icon: <AlertTriangle className="size-4" />,
    category: "insert",
    command: ({ editor }) => {
      editor.chain().focus().setAdmonition("warning").run();
    },
  },
  {
    title: t("common.slashMenu.danger"),
    description: t("common.slashMenu.dangerDesc"),
    icon: <AlertCircle className="size-4" />,
    category: "insert",
    command: ({ editor }) => {
      editor.chain().focus().setAdmonition("danger").run();
    },
  },
  {
    title: t("common.slashMenu.image"),
    description: t("common.slashMenu.imageDesc"),
    icon: <ImageIcon className="size-4" />,
    category: "insert",
    command: ({ editor }) => {
      editor.chain().focus().insertImagePlaceholder().run();
    },
  },
  {
    title: t("common.slashMenu.link"),
    description: t("common.slashMenu.linkDesc"),
    icon: <Link2 className="size-4" />,
    category: "insert",
    command: ({ editor }) => {
      editor.chain().focus().insertLinkPlaceholder().run();
    },
  },
  {
    title: t("common.slashMenu.table"),
    description: t("common.slashMenu.tableDesc"),
    icon: <Table className="size-4" />,
    category: "insert",
    command: ({ editor }) => {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
];

interface SlashMenuProps {
  items: SlashMenuItem[];
  command: (item: SlashMenuItem) => void;
  t: any;
}

export interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const SlashMenuComponent = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command, t }, ref) => {
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

    const allGroupedItems: Array<{
      category: SlashMenuCategory;
      items: SlashMenuItem[];
    }> = [];
    (["ai", "heading", "list", "insert"] as SlashMenuCategory[]).forEach(
      (category) => {
        if (groupedItems[category] && groupedItems[category].length > 0) {
          allGroupedItems.push({ category, items: groupedItems[category] });
        }
      }
    );

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
                  {getCategoryLabel(group.category, t)}
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
            {t("common.slashMenu.noCommands")}
          </div>
        )}
      </div>
    );
  }
);

SlashMenuComponent.displayName = "SlashMenuComponent";

export const createSlashMenuPlugin = (t: any) => {
  let popup: TippyInstance[] | null = null;
  const SLASH_MENU_ITEMS = getSlashMenuItems(t);

  return {
    char: "/",

    items: ({ query }: { query: string }) => {
      if (!query) {
        return SLASH_MENU_ITEMS;
      }
      return SLASH_MENU_ITEMS.filter((item) => {
        const searchStr = query.toLowerCase();
        // 普通文本匹配
        if (
          item.title.toLowerCase().includes(searchStr) ||
          item.description.toLowerCase().includes(searchStr)
        ) {
          return true;
        }
        // 拼音匹配
        const matchTitle = PinyinMatch.match(item.title, query);
        const matchDesc = PinyinMatch.match(item.description, query);
        return matchTitle !== false || matchDesc !== false;
      });
    },

    render: () => {
      let localComponent: ReactRenderer;

      return {
        onStart: (props: any) => {
          // 锁定主容器滚动，防止弹出菜单位置偏移
          lockScroll();

          localComponent = new ReactRenderer(SlashMenuComponent, {
            props: {
              items: props.items,
              t,
              command: (item: SlashMenuItem) => {
                // 删除 / 字符和查询文本
                props.editor.chain().focus().deleteRange(props.range).run();

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
            popperOptions: {
              strategy: "fixed",
              modifiers: [
                {
                  name: "flip",
                  options: {
                    fallbackPlacements: ["top-start", "bottom-start"],
                  },
                },
                {
                  name: "preventOverflow",
                  options: {
                    boundary: "viewport",
                    padding: 8,
                  },
                },
              ],
            },
          });
        },

        onUpdate(props: any) {
          localComponent.updateProps({
            items: props.items,
            command: (item: SlashMenuItem) => {
              props.editor.chain().focus().deleteRange(props.range).run();

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
          // 解锁滚动
          unlockScroll();

          popup?.[0]?.destroy();
          localComponent?.destroy();
          popup = null;
        },
      };
    },
  };
};
