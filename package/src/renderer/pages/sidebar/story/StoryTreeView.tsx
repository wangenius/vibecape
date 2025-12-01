import { context } from "@/components/custom/ContextMenu";
import { dialog } from "@/components/custom/DialogModal";
import { Empty } from "@/components/custom/Empty";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "@/components/ui/menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { StoryCard } from "@/components/cosmos/story/StoryCard";
import { StoryBoomPanel } from "@/pages/modal/StoryBoomPanel";
import { StoryNextPanel } from "@/pages/modal/StoryNextPanel";
import { openBayBar } from "@/hook/app/useViewManager";
import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AtSign, ChevronRight } from "lucide-react";
import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  TbArrowAutofitDown,
  TbBoom,
  TbDots,
  TbScript,
  TbSquareRounded,
  TbSquareRoundedCheck,
  TbSquareRoundedPlus,
  TbTrash,
} from "react-icons/tb";
import { Story } from "@common/schema";
import { useCosmos } from "@/hook/cosmos/useCosmos";

/* 小说章节展开状态 */
interface StoriesExpandedState {
  expanded: Record<string, boolean>;
  setExpanded: (storyId: string, value: boolean) => void;
  updateExpanded: (
    updater: (prev: Record<string, boolean>) => Record<string, boolean>
  ) => void;
}

const useStoriesExpandedStore = create<StoriesExpandedState>()(
  persist(
    (set) => ({
      expanded: {},
      setExpanded: (storyId, value) =>
        set((state) => ({
          expanded: {
            ...state.expanded,
            [storyId]: value,
          },
        })),
      updateExpanded: (updater) =>
        set((state) => ({
          expanded: updater(state.expanded),
        })),
    }),
    {
      name: "stories-expanded",
    }
  )
);

export const StoriesExpandedStore = {
  use: () => useStoriesExpandedStore((state) => state.expanded),
  set: (
    updater: (prev: Record<string, boolean>) => Record<string, boolean>
  ) => {
    useStoriesExpandedStore.getState().updateExpanded(updater);
  },
};

// 常量定义
const DRAG_HOVER_DELAY = 800;
const INDENT_WIDTH = 24;
const DEFAULT_STORY_NAME = "未命名情节";

// 创建 PopoverContext
interface PopoverContextType {
  enabled: boolean;
  activePopover: string | null;
  setActivePopover: (id: string | null) => void;
}

const PopoverContext = createContext<PopoverContextType>({
  enabled: true,
  activePopover: null,
  setActivePopover: () => {},
});

// 提取类型定义
type StoryTreeNodeData = Story;

interface StoryTreeNodeProps {
  story: StoryTreeNodeData;
  index: number;
  level?: number;
  children?: StoryTreeNodeData[];
  isExpanded?: boolean;
  onToggle?: () => void;
  selected?: boolean;
  onClick?: () => void;
  isDraggingOver: string | null;
  isMultiSelect?: boolean;
  onMultiSelect?: (isMultiSelect: boolean) => void;
}

interface StoryTreeViewProps {
  stories: Story[];
  selectedStoryId?: string;
  onStorySelect: (storyId: string) => void;
  isMultiSelect?: boolean;
  onMultiSelect: (isMultiSelect: boolean) => void;
  selectedStoryIds: Set<string>;
}

// 抽取通用样式
const nodeBaseStyles = {
  base: cn(
    "group relative flex items-center gap-2 py-1 pl-1 pr-1 rounded-lg mx-1",
    "transition-all duration-200 ease-out",
    "cursor-pointer",
    "border border-transparent",
    "hover:bg-muted-foreground/5"
  ),
  selected: ["bg-primary/5 hover:bg-primary/8"],
  dragging: ["opacity-50"],
  dragOver: [],
};

// 节点组件
const StoryTreeNode: React.FC<StoryTreeNodeProps> = memo((props) => {
  const { enabled, activePopover, setActivePopover } =
    useContext(PopoverContext);
  const {
    story,
    level = 0,
    children = [],
    isExpanded = false,
    onToggle,
    selected,
    onClick,
    isDraggingOver,
    isMultiSelect,
    onMultiSelect,
  } = props;

  useEffect(() => {
    const handleClickOutside = (_e: MouseEvent) => {
      if (activePopover) {
        setActivePopover(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [activePopover]);

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: story.id,
    data: {
      id: story.id,
      name: story.name,
      parent_id: story.parent_id,
      order_index: story.order_index,
      type: "story",
    },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: story.id,
    data: {
      id: story.id,
      name: story.name,
      parent_id: story.parent_id,
      order_index: story.order_index,
      type: "story",
    },
  });

  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef]
  );

  const nodeStyles = cn(
    nodeBaseStyles.base,
    selected && nodeBaseStyles.selected,
    isDragging && nodeBaseStyles.dragging,
    isOver && !isDragging && nodeBaseStyles.dragOver
  );

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle?.();
    },
    [onToggle]
  );

  const handlePopoverToggle = (id: string) => {
    if (activePopover === id) {
      setActivePopover(null);
    } else {
      setActivePopover(id);
    }
  };

  const menuItems = useMemo(
    () => [
      {
        label: "拆解",
        icon: TbBoom,
        onClick: (close?: () => void) => {
          setActivePopover(`${story.id}-boom`);
          close?.();
        },
        popover: true,
        panel: (
          <StoryBoomPanel story={story} close={() => setActivePopover(null)} />
        ),
      },
      {
        label: "接续",
        icon: TbArrowAutofitDown,
        onClick: (close?: () => void) => {
          setActivePopover(`${story.id}-next`);
          close?.();
        },
        popover: true,
        panel: (
          <StoryNextPanel story={story} close={() => setActivePopover(null)} />
        ),
      },
      { type: "divide" as const },
      {
        label: "添加子情节",
        icon: TbSquareRoundedPlus,
        onClick: (close?: () => void) => {
          useCosmos.getState().insertStory({
            parent_id: story.id,
          });
          close?.();
        },
      },
      {
        label: "选择",
        icon: TbSquareRoundedCheck,
        onClick: (close?: () => void) => {
          onMultiSelect?.(true);
          close?.();
        },
      },
      { type: "divide" as const },
      {
        label: "删除",
        icon: TbTrash,
        variant: "destructive" as const,
        onClick: (close?: () => void) => {
          dialog.confirm({
            title: "确认删除",
            content: `确认要删除情节${story.name}吗？删除情节后，该情节、该情节下的所有嵌套子情节、与该情节和该情节下所有嵌套子情节关联的角色状态和角色关系均会被删除。请查询后谨慎考虑后执行。`,
            okText: "确认",
            cancelText: "取消",
            onOk: () => {
              useCosmos.getState().removeStory(story.id);
              close?.();
            },
          });
        },
      },
    ],
    [story.id, story.name, onMultiSelect]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (isMultiSelect) return;

      e.preventDefault();
      e.stopPropagation();
      context({
        event: e,
        content: (close) => (
          <Menu
            items={menuItems.map((item) => {
              if (item.type === "divide") return item;
              return {
                ...item,
                onClick: () => item.onClick(close),
              };
            })}
          />
        ),
      });
    },
    [isMultiSelect, menuItems]
  );

  const renderDropdownMenuItems = useCallback(
    () =>
      menuItems.map((item, index) => {
        if (item.type === "divide") {
          return <DropdownMenuSeparator key={index} />;
        }
        return (
          <DropdownMenuItem
            key={index}
            variant={item.variant}
            onClick={() => item.onClick()}
          >
            {React.createElement(item.icon, { className: "h-6 w-6" })}
            <span>{item.label}</span>
          </DropdownMenuItem>
        );
      }),
    [menuItems]
  );

  const renderContent = () => (
    <div className="relative">
      <div
        ref={setNodeRef}
        className={nodeStyles}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        {...listeners}
        {...attributes}
      >
        <div className="flex items-center gap-1 touch-none select-none hover:bg-muted-foreground/10 rounded-md">
          {children.length > 0 ? (
            <>
              <ChevronRight
                className={cn(
                  "h-6 w-6 rounded-md p-1",
                  "transition-all duration-200",
                  "text-primary",
                  isExpanded && "transform rotate-90  text-primary"
                )}
                onClick={handleToggle}
              />
              {isMultiSelect && (
                <div className="flex items-center justify-center w-6 h-6 p-1">
                  {selected ? (
                    <TbSquareRoundedCheck className="h-6 w-6 text-primary animate-in fade-in-0" />
                  ) : (
                    <TbSquareRounded className="h-6 w-6 text-primary animate-in fade-in-0" />
                  )}
                </div>
              )}
            </>
          ) : isMultiSelect ? (
            <div className="flex items-center justify-center w-6 h-6 p-1">
              {selected ? (
                <TbSquareRoundedCheck className="h-6 w-6 text-primary animate-in fade-in-0" />
              ) : (
                <TbSquareRounded className="h-6 w-6 text-primary animate-in fade-in-0" />
              )}
            </div>
          ) : (
            <TbScript
              onClick={(e) => {
                e.stopPropagation();
                onMultiSelect?.(true);
              }}
              className={cn(
                "h-6 w-6 rounded-md p-1",
                "text-primary",
                selected && "text-primary"
              )}
            />
          )}
        </div>

        <div
          className={cn(
            "flex-1 min-w-0 text-[13px] truncate",
            "text-foreground",
            "transition-colors duration-200",
            selected && "text-foreground font-medium"
          )}
        >
          {story.name || DEFAULT_STORY_NAME}
        </div>

        {!isMultiSelect && (
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="flex items-center gap-1 transition-all duration-200"
          >
            <Popover open={activePopover === `${story.id}-boom`}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePopoverToggle(`${story.id}-boom`)}
                  className={cn(
                    "h-6 w-0 p-1 rounded-md opacity-0 group-hover:w-6 group-hover:opacity-100",
                    "hover:bg-primary/10",
                    "transition-colors duration-200 data-[state=open]:bg-muted-foreground/20 data-[state=open]:opacity-100 data-[state=open]:w-6",
                    activePopover?.startsWith(story.id) && "w-6"
                  )}
                >
                  <TbBoom className="h-6 w-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <StoryBoomPanel
                  story={story}
                  close={() => setActivePopover(null)}
                />
              </PopoverContent>
            </Popover>

            <Popover open={activePopover === `${story.id}-next`}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePopoverToggle(`${story.id}-next`)}
                  className={cn(
                    "h-6 w-0 p-1 rounded-md opacity-0 group-hover:w-6 group-hover:opacity-100",
                    "hover:bg-primary/10",
                    "transition-colors duration-200 data-[state=open]:bg-muted-foreground/20 data-[state=open]:opacity-100 data-[state=open]:w-6",
                    activePopover?.startsWith(story.id) && "w-6"
                  )}
                >
                  <TbArrowAutofitDown className="h-6 w-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <StoryNextPanel
                  story={story}
                  close={() => setActivePopover(null)}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // 确保右侧 Chat 面板已打开
                openBayBar();
                window.dispatchEvent(
                  new CustomEvent("insert-story-mention", {
                    detail: {
                      id: story.id,
                      label: story.name || DEFAULT_STORY_NAME,
                    },
                  })
                );
              }}
              className={cn(
                "h-6 w-0 p-1 rounded-md opacity-0 group-hover:w-6 group-hover:opacity-100",
                "hover:bg-primary/10",
                "transition-colors duration-200"
              )}
            >
              <AtSign className="h-6 w-6" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-1 rounded-md opacity-0 group-hover:opacity-100",
                    "hover:bg-primary/10",
                    "transition-colors duration-200 data-[state=open]:bg-muted-foreground/20 data-[state=open]:opacity-100"
                  )}
                >
                  <TbDots className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {renderDropdownMenuItems()}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Drop 指示器 */}
      {isOver && !isDragging && (
        <>
          {isDraggingOver === story.id ? (
            <div className="absolute inset-0 border-2 border-primary/30 rounded-lg bg-primary/5 animate-in fade-in-0 zoom-in-95" />
          ) : (
            <div className="absolute -top-0.5 inset-x-0 h-[3px] bg-primary/50" />
          )}
        </>
      )}
    </div>
  );

  return (
    <div style={{ paddingLeft: level * INDENT_WIDTH }} className="relative">
      {level > 0 && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0",
            "border-l border-dashed border-border/15",
            "group-hover:border-primary/20 transition-colors duration-200"
          )}
          style={{ left: level * INDENT_WIDTH - 12 }}
        />
      )}

      {enabled && !isMultiSelect ? (
        <Popover>
          <PopoverTrigger asChild>{renderContent()}</PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            className="w-[600px]"
            sideOffset={16}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <StoryCard id={story.id} className="max-h-[90vh] overflow-y-auto" />
          </PopoverContent>
        </Popover>
      ) : (
        renderContent()
      )}
    </div>
  );
});

StoryTreeNode.displayName = "StoryTreeNode";

// 主组件
const StoryTreeView = memo<StoryTreeViewProps>((props) => {
  const expandeds = StoriesExpandedStore.use();
  const { active, over } = useDndContext();
  const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);
  const [activePopover, setActivePopover] = useState<string | null>(null);

  useEffect(() => {
    if (!over || !active) {
      setIsDraggingOver(null);
      return;
    }

    const timer = setTimeout(() => {
      if (over.id !== "novel-home-drop") {
        setIsDraggingOver(over.id as string);
      }
    }, DRAG_HOVER_DELAY);

    return () => clearTimeout(timer);
  }, [over, active]);

  const { tree, getChildren } = useMemo(() => {
    const buildTree = () => {
      return props.stories
        .filter((story) => !story.parent_id)
        .sort((a, b) => a.order_index - b.order_index);
    };

    const getChildren = (parentId: string): Story[] =>
      props.stories
        .filter((story) => story.parent_id === parentId)
        .sort((a, b) => a.order_index - b.order_index);

    return { tree: buildTree(), getChildren };
  }, [props.stories]);

  const handleStorySelect = useCallback(
    (storyId: string) => {
      props.onStorySelect(storyId);
    },
    [props.onStorySelect]
  );

  const handleToggleExpanded = useCallback((storyId: string) => {
    StoriesExpandedStore.set((prev) => ({
      ...prev,
      [storyId]: !prev[storyId],
    }));
  }, []);

  const renderStoryTree = useCallback(
    (stories: StoryTreeNodeData[], level = 0) => {
      return stories.map((story, index) => {
        const children = getChildren(story.id);
        const isExpanded = expandeds[story.id];

        return (
          <div key={story.id} className="space-y-0.5 overflow-x-hidden">
            <StoryTreeNode
              story={story}
              index={index}
              level={level}
              children={children}
              isExpanded={isExpanded}
              onMultiSelect={props.onMultiSelect}
              onToggle={() => handleToggleExpanded(story.id)}
              selected={
                props.isMultiSelect
                  ? props.selectedStoryIds?.has(story.id)
                  : props.selectedStoryId === story.id
              }
              onClick={() => handleStorySelect(story.id)}
              isDraggingOver={isDraggingOver}
              isMultiSelect={props.isMultiSelect}
            />
            {isExpanded &&
              children.length > 0 &&
              renderStoryTree(children, level + 1)}
          </div>
        );
      });
    },
    [
      getChildren,
      expandeds,
      props.onMultiSelect,
      handleToggleExpanded,
      props.isMultiSelect,
      props.selectedStoryIds,
      props.selectedStoryId,
      handleStorySelect,
      isDraggingOver,
    ]
  );

  return (
    <PopoverContext.Provider
      value={{ enabled: !props.isMultiSelect, activePopover, setActivePopover }}
    >
      <div className="space-y-0.5">
        {tree.length > 0 ? (
          renderStoryTree(tree)
        ) : (
          <Empty content="暂无情节" className="pt-20" />
        )}
      </div>
    </PopoverContext.Provider>
  );
});

StoryTreeView.displayName = "StoryTreeView";

export { PopoverContext, StoryTreeNode, StoryTreeView };
export type { StoryTreeNodeProps, StoryTreeViewProps };
