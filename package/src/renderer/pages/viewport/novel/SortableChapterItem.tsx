import { cn } from "@/lib/utils";
import { FilterSelector } from "@/components/custom/FilterSelector";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNovelStore, updateChapterByIndex } from "@/hook/novel/useNovel";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import React, { CSSProperties, useCallback, useContext, useEffect, useState } from "react";
import {
  TbArrowAutofitLeft,
  TbBorderBottomPlus,
  TbBorderTopPlus,
  TbDots,
  TbScript,
  TbTrash,
} from "react-icons/tb";
import { Chapter } from "@common/schema/novel";
import { Story } from "@common/schema";
import { PopoverContext } from "./ChapterPopoverContext";
import { SelectionContext } from "./ChapterSelectionContext";
import { StoryContent } from "./StoryContent";

interface SortableItemProps {
  chapter: Chapter;
  index: number;
  story?: Story;
  stories?: Record<string, Story>;
}

export const SortableChapterItem: React.FC<SortableItemProps> = React.memo(
  ({ chapter, index, story, stories }) => {
    const { activePopover, setActivePopover } = useContext(PopoverContext);
    const {
      isSelectionMode,
      toggleChapterSelection,
      isChapterSelected,
      setSelectionMode,
    } = useContext(SelectionContext);

    const {
      attributes,
      isDragging,
      listeners,
      setNodeRef: setSortableRef,
    } = useDraggable({
      id: chapter.id,
      data: {
        type: "chapter",
        id: chapter.id,
        name: chapter.name,
      },
    });

    const { setNodeRef: setDropRef, isOver } = useDroppable({
      id: chapter.id,
      data: {
        id: chapter.id,
        name: chapter.name,
        type: "chapter",
      },
    });

    const setNodeRef = useCallback(
      (node: HTMLElement | null) => {
        setSortableRef(node);
        setDropRef(node);
      },
      [setSortableRef, setDropRef]
    );

    const [active, setActive] = useState(false);

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
    }, [activePopover, setActivePopover]);

    const style: CSSProperties = {
      position: "relative",
      zIndex: isDragging ? 999 : 1,
    };

    const currentChapterIndex = useNovelStore.getState().currentChapterIndex;

    const className = cn(
      "group relative flex items-center gap-1 py-1 px-1 rounded-lg",
      "border border-transparent",
      isDragging
        ? "shadow-lg bg-background border-primary/30"
        : "hover:bg-muted/80 hover:border-primary/20",
      currentChapterIndex === index && "bg-muted-foreground/10",
      active && "bg-muted-foreground/10",
      isOver &&
        "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary/30",
      isChapterSelected(chapter.id) && "bg-primary/5 border-primary/30"
    );

    const handleAddChapterAbove = React.useCallback(() => {
      useNovelStore.getState().insertChapter(index);
      setActive(false);
    }, [index]);

    const handleAddChapterBelow = React.useCallback(() => {
      useNovelStore.getState().insertChapter(index + 1);
      setActive(false);
    }, [index]);

    const handleDelete = React.useCallback(() => {
      useNovelStore.getState().removeChapterByIndex(index);
      setActive(false);
    }, [index]);

    const handleIndexButtonClick = (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isSelectionMode) {
        toggleChapterSelection(chapter.id);
      } else {
        setSelectionMode(true);
        toggleChapterSelection(chapter.id);
      }
    };

    return (
      <div
        {...(isSelectionMode ? {} : listeners)}
        ref={setNodeRef}
        style={style}
        {...(isSelectionMode ? {} : attributes)}
        className={className}
        onClick={(e) => {
          e.stopPropagation();
          if (isSelectionMode) {
            toggleChapterSelection(chapter.id);
          } else {
            useNovelStore.getState().setCurrentChapterIndex(index);
          }
        }}
      >
        <div
          className={cn(
            "flex items-center touch-none select-none",
            isSelectionMode
              ? "cursor-pointer"
              : "cursor-grab active:cursor-grabbing"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-xs group-hover:bg-muted-foreground/10 hover:bg-muted-foreground/20"
            onClick={handleIndexButtonClick}
          >
            {isSelectionMode ? (
              <Checkbox
                checked={isChapterSelected(chapter.id)}
                className="h-4 w-4"
              />
            ) : (
              index + 1
            )}
          </Button>
        </div>

        <div className="grow min-w-0 truncate">
          <span className="text-xs font-medium">
            {chapter.name || "未命名章节"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {story ? (
            <Popover>
              <PopoverTrigger onClick={(e) => e.stopPropagation()} asChild>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    className="h-6 text-xs p-1 text-muted-foreground/80 group-hover:bg-muted-foreground/10
                    hover:bg-muted-foreground/20
                    data-[state=open]:bg-muted-foreground/20
                    data-[state=open]:opacity-100 max-w-16 truncate line-clamp-1"
                  >
                    {story.name}
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="end"
                className="w-[400px] max-h-[40vh] overflow-y-auto"
              >
                <StoryContent story={story} chapterIndex={index} />
              </PopoverContent>
            </Popover>
          ) : (
            <FilterSelector
              trigger={
                <Button
                  onClick={(e) => e.stopPropagation()}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-xs p-1 opacity-0 group-hover:opacity-100 group-hover:bg-muted-foreground/10
            hover:bg-muted-foreground/20
            data-[state=open]:bg-muted-foreground/20
            data-[state=open]:opacity-100
            text-muted-foreground/50"
                >
                  <TbScript className="h-4 w-4" />
                </Button>
              }
              items={
                stories
                  ? Object.values(stories).map((story) => ({
                      id: story.id,
                      name: story.name,
                    }))
                  : []
              }
              align="end"
              onDelete={() => {
                if (index === null) return;
                updateChapterByIndex(index, {
                  story_id: undefined,
                });
              }}
              onSelect={(story) => {
                if (index === null) return;
                updateChapterByIndex(index, {
                  story_id: story.id,
                });
              }}
            />
          )}
        </div>
        {!isSelectionMode && (
          <DropdownMenu open={active} onOpenChange={setActive}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-xs p-1 opacity-0 group-hover:opacity-100 group-hover:bg-muted-foreground/10
                hover:bg-muted-foreground/20
                data-[state=open]:bg-muted-foreground/20
                data-[state=open]:opacity-100
                "
              >
                <TbDots className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleAddChapterAbove}>
                <TbBorderBottomPlus className="h-4 w-4" />
                在上方添加章节
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddChapterBelow}>
                <TbBorderTopPlus className="h-4 w-4" />
                在下方添加章节
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={async () => {}}>
                <TbArrowAutofitLeft className="h-4 w-4" />
                章节拆解
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                <TbTrash className="h-4 w-4" />
                删除章节
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  },
  () => {
    return false;
  }
);

SortableChapterItem.displayName = "SortableChapterItem";
