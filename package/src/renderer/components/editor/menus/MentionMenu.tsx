/**
 * Mention Menu 组件
 * 输入 @ 时弹出的提及菜单，支持 story、actant、lore
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
import { cn } from "@/lib/utils";
import { TbScript, TbMoodNeutral, TbSwipe } from "react-icons/tb";

export type MentionType = "story" | "actant" | "lore";

export interface MentionItem {
  id: string;
  label: string;
  type: MentionType;
  description?: string;
}

interface MentionMenuProps {
  items: MentionItem[];
  command: (item: MentionItem) => void;
}

export interface MentionMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const getMentionIcon = (type: MentionType) => {
  switch (type) {
    case "story":
      return <TbScript className="size-4" />;
    case "actant":
      return <TbMoodNeutral className="size-4" />;
    case "lore":
      return <TbSwipe className="size-4" />;
  }
};

const getMentionTypeLabel = (type: MentionType, t: any) => {
  switch (type) {
    case "story":
      return t("common.mentionMenu.story");
    case "actant":
      return t("common.mentionMenu.actant");
    case "lore":
      return t("common.mentionMenu.lore");
  }
};

const getMentionTypeColor = (type: MentionType) => {
  switch (type) {
    case "story":
      return "text-blue-600 dark:text-blue-400";
    case "actant":
      return "text-violet-600 dark:text-violet-400";
    case "lore":
      return "text-emerald-600 dark:text-emerald-400";
  }
};

export const MentionMenuComponent = forwardRef<
  MentionMenuRef,
  MentionMenuProps & { isLoading?: boolean; t: any }
>(({ items, command, isLoading = false, t }, ref) => {
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

  // 按类型分组
  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<MentionType, MentionItem[]>
  );

  const allGroupedItems: Array<{ type: MentionType; items: MentionItem[] }> =
    [];
  (["story", "actant", "lore"] as MentionType[]).forEach((type) => {
    if (groupedItems[type] && groupedItems[type].length > 0) {
      allGroupedItems.push({ type, items: groupedItems[type] });
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
      className="bg-background border border-border rounded-2xl overflow-hidden w-64 max-h-80 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-none"
      style={{
        scrollbarWidth: "none",
      }}
    >
      {isLoading ? (
        <div className="px-3 py-6 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          <span className="text-xs">{t("common.mentionMenu.loading")}</span>
        </div>
      ) : items.length > 0 ? (
        <div className="flex flex-col">
          {allGroupedItems.map((group, groupIndex) => (
            <div key={group.type}>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide select-none">
                {getMentionTypeLabel(group.type, t)}
              </div>
              <div className="px-1">
                {group.items.map((item, itemIndex) => {
                  const globalIndex = getGlobalIndex(groupIndex, itemIndex);
                  const isSelected = globalIndex === selectedIndex;
                  return (
                    <button
                      key={item.id}
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
                          getMentionTypeColor(item.type)
                        )}
                      >
                        {getMentionIcon(item.type)}
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
                          {item.label}
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
          {t("common.mentionMenu.noResults")}
        </div>
      )}
    </div>
  );
});

MentionMenuComponent.displayName = "MentionMenuComponent";

/** 获取所有 Mention 数据 */
function getAllMentionItems(): MentionItem[] {
  const items: MentionItem[] = [];

  return items;
}

export const createMentionPlugin = (t: any) => {
  let popup: TippyInstance[] | null = null;
  let cachedItems: MentionItem[] | null = null;

  return {
    char: "@",

    items: async ({ query }: { query: string }) => {
      // 如果有缓存，直接使用缓存过滤
      if (cachedItems) {
        if (!query || query.trim() === "") {
          return cachedItems;
        }
        const searchStr = query.toLowerCase();
        return cachedItems.filter((item) => {
          return (
            item.label.toLowerCase().includes(searchStr) ||
            item.description?.toLowerCase().includes(searchStr)
          );
        });
      }

      // 如果没有缓存，返回空数组（菜单会显示加载状态）
      // 数据会在后台加载
      return [];
    },

    render: () => {
      let localComponent: ReactRenderer;

      // 创建命令回调函数
      const createCommandCallback =
        (currentProps: any) => (item: MentionItem) => {
          // 删除 @ 字符和查询文本
          currentProps.editor
            .chain()
            .focus()
            .deleteRange(currentProps.range)
            .run();

          // 插入 mention 节点
          currentProps.editor
            .chain()
            .focus()
            .insertContent({
              type: "mention",
              attrs: {
                id: item.id,
                label: item.label,
                mentionType: item.type,
              },
            })
            .run();

          // 关闭菜单
          popup?.[0]?.hide();
        };

      return {
        onStart: (props: any) => {
          // 立即创建并显示菜单，带加载状态
          const isLoading = !cachedItems;

          localComponent = new ReactRenderer(MentionMenuComponent, {
            props: {
              items: props.items,
              isLoading,
              command: createCommandCallback(props),
              t,
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

          // 如果没有缓存，异步加载数据
          if (!cachedItems) {
            setTimeout(() => {
              console.log("[MentionMenu] Loading items asynchronously...");
              cachedItems = getAllMentionItems();
              console.log("[MentionMenu] Loaded items:", cachedItems.length);

              // 更新菜单内容
              if (localComponent) {
                const query = props.query || "";
                let filteredItems = cachedItems;

                if (query.trim() !== "") {
                  const searchStr = query.toLowerCase();
                  filteredItems = cachedItems.filter((item) => {
                    return (
                      item.label.toLowerCase().includes(searchStr) ||
                      item.description?.toLowerCase().includes(searchStr)
                    );
                  });
                }

                localComponent.updateProps({
                  items: filteredItems,
                  isLoading: false,
                });
              }
            }, 0);
          }
        },

        onUpdate(props: any) {
          localComponent.updateProps({
            items: props.items,
            isLoading: !cachedItems,
            command: createCommandCallback(props),
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

          const ref = localComponent?.ref as MentionMenuRef | null;
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
