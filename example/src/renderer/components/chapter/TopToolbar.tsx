import { Button } from "@/components/ui/button";
import { memo } from "react";
import { BsLayoutSidebar, BsLayoutSidebarInset } from "react-icons/bs";
import { cn } from "@/lib/utils";

interface TopToolbarProps {
  wordCount: number;
  chapterIndex: number | null;
  showChapterList: boolean;
  onToggleChapterList: () => void;
}

export const TopToolbar = memo(
  ({ wordCount, showChapterList, onToggleChapterList }: TopToolbarProps) => {
    return (
      <div className="flex items-center justify-between w-full h-14 px-4">
        {/* 左侧区域 - 目录切换按钮 */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleChapterList}
            className={cn(
              "size-7 hover:bg-muted-foreground/10",
              showChapterList
                ? "bg-muted-foreground/10"
                : "bg-transparent hover:bg-muted-foreground/10"
            )}
            title={showChapterList ? "隐藏章节目录" : "显示章节目录"}
          >
            {showChapterList ? (
              <BsLayoutSidebarInset className="size-4" />
            ) : (
              <BsLayoutSidebar className="size-4" />
            )}
          </Button>
        </div>

        {/* 右侧区域 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {wordCount} 字
          </span>
        </div>
      </div>
    );
  }
);
