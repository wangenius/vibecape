/**
 * Prompt Menu 组件
 * 输入 # 时弹出的 Prompt 选择菜单
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
import { lockScroll, unlockScroll } from "@/lib/editor/scroll-lock";
import { TbPrompt } from "react-icons/tb";
import { usePromptStore, type PromptItem } from "@/hooks/stores/usePromptStore";

export interface PromptMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface PromptMenuProps {
  items: PromptItem[];
  command: (item: PromptItem) => void;
  isLoading?: boolean;
  t: any;
}

export const PromptMenuComponent = forwardRef<PromptMenuRef, PromptMenuProps>(
  ({ items, command, isLoading = false, t }, ref) => {
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

    // 获取 prompt 文本
    const getPromptText = usePromptStore.getState().getPromptText;

    return (
      <div
        ref={containerRef}
        className="bg-background border border-border rounded-2xl overflow-hidden w-72 max-h-80 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-none"
        style={{
          scrollbarWidth: "none",
        }}
      >
        {isLoading ? (
          <div className="px-3 py-6 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            <span className="text-xs">{t("common.promptMenu.loading", "加载中...")}</span>
          </div>
        ) : items.length > 0 ? (
          <div className="flex flex-col">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide select-none">
              {t("common.promptMenu.prompts", "Prompts")}
            </div>
            <div className="px-1">
              {items.map((item, index) => {
                const isSelected = index === selectedIndex;
                const bodyText = getPromptText(item.id);
                return (
                  <button
                    key={item.id}
                    ref={(el) => (itemRefs.current[index] = el)}
                    className={cn(
                      "w-full flex items-start gap-2.5 px-2 py-2 rounded-md text-left transition-all duration-100 group outline-none",
                      isSelected
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent/50"
                    )}
                    onClick={() => selectItem(index)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center size-6 rounded-md transition-colors shrink-0 mt-0.5",
                        "text-primary"
                      )}
                    >
                      <TbPrompt className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className={cn(
                          "text-xs font-medium truncate block leading-tight",
                          isSelected
                            ? "text-accent-foreground"
                            : "text-foreground"
                        )}
                      >
                        {item.title}
                      </span>
                      {bodyText && (
                        <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {bodyText}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="px-3 py-6 text-sm text-muted-foreground text-center">
            {t("common.promptMenu.noResults", "没有找到 Prompt")}
          </div>
        )}
      </div>
    );
  }
);

PromptMenuComponent.displayName = "PromptMenuComponent";

/**
 * 创建 Prompt 选择插件
 * 用于在 AI Prompt 输入框中输入 # 时弹出选择菜单
 */
export const createPromptPlugin = (t: any) => {
  let popup: TippyInstance[] | null = null;

  return {
    char: "#",

    items: async ({ query }: { query: string }) => {
      const { searchPrompts } = usePromptStore.getState();
      return searchPrompts(query);
    },

    render: () => {
      let localComponent: ReactRenderer;

      // 创建命令回调函数 - 插入 PromptNode
      const createCommandCallback =
        (currentProps: any) => (item: PromptItem) => {
          // 删除 # 字符和查询文本，然后插入 PromptNode
          currentProps.editor
            .chain()
            .focus()
            .deleteRange(currentProps.range)
            .setPromptNode({ id: item.id, title: item.title })
            .run();

          // 记录使用
          usePromptStore.getState().recordUsage(item.id);

          // 关闭菜单
          popup?.[0]?.hide();
        };

      return {
        onStart: (props: any) => {
          // 锁定主容器滚动，防止弹出菜单位置偏移
          lockScroll();

          localComponent = new ReactRenderer(PromptMenuComponent, {
            props: {
              items: props.items,
              isLoading: false,
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
        },

        onUpdate(props: any) {
          localComponent.updateProps({
            items: props.items,
            isLoading: false,
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

          const ref = localComponent?.ref as PromptMenuRef | null;
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
