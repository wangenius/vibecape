import { Button } from "@/components/ui/button";
import { SidebarHeader } from "../SidebarHeader";
import {
  useNovel,
  useNovelList,
  openNovel,
  deleteNovel,
} from "@/hook/novel/useNovel";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import { cn } from "@/lib/utils";
import { useCallback, useMemo, useState } from "react";
import {
  TbDeviceGamepad2,
  TbDots,
  TbFileExport,
  TbFileImport,
  TbPencil,
  TbPhoto,
  TbPlus,
  TbRobot,
  TbTrash,
} from "react-icons/tb";
import { ImportNovelPanel } from "../../../components/custom/ImportNovelPanel";
import { NovelCreateForm } from "../../modal/Publication";
import { toast } from "sonner";
import { openNovelTab } from "@/hook/app/useViewManager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NovelExportTxtPanel } from "@/components/custom/ExportPanel";
import NovelNameEdit from "@/pages/modal/NovelNameEdit";
import { Novel } from "@common/schema/novel";

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString();

const WorksAICreate = ({ close }: { close: () => void }) => {
  const handleAIAction = (message: string, action?: () => void) => {
    close();
    action?.();
    toast.info(message);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        onClick={() => handleAIAction("AI创作小说功能开发中，敬请期待。")}
      >
        AI 创建小说
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleAIAction("AI 创建其他作品类型开发中，敬请期待。")}
      >
        AI 创建其他作品
      </Button>
    </div>
  );
};

export const OpusListSection = () => {
  const novelList = useNovelList();
  const currentNovelId = useNovel((novel) => novel.id ?? null);
  const currentCosmosId = useCosmos((state) => state?.current_meta?.id);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const works = useMemo(
    () => Object.values(novelList).sort((a, b) => b.updated_at - a.updated_at),
    [novelList]
  );

  const handleOpenWork = useCallback(
    async (novel: Novel) => {
      if (openingId || !novel.id) return;

      // 检查是否有打开的项目
      if (!currentCosmosId) {
        toast.error("请先打开一个世界观");
        return;
      }

      try {
        setOpeningId(novel.id);
        await openNovel(novel.id);
        // 使用 tabManager 为每个作品打开独立标签
        openNovelTab(novel.id, novel.name || "未命名作品");
      } catch (error) {
        console.error("打开作品失败:", error);
        toast.error("打开作品失败", {
          description: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setOpeningId(null);
      }
    },
    [openingId, currentCosmosId]
  );

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      <SidebarHeader
        left={""}
        AICreate={WorksAICreate}
        list={[
          {
            icon: TbPlus,
            label: "创建小说",
            onClick: () => NovelCreateForm.open(),
          },
          {
            icon: TbRobot,
            label: "创建智能体",
            onClick: () => toast.info("智能体创作功能开发中，敬请期待。"),
          },
          {
            icon: TbPhoto,
            label: "创建漫画",
            onClick: () => toast.info("漫画创作功能开发中，敬请期待。"),
          },
          {
            icon: TbDeviceGamepad2,
            label: "创建文字游戏",
            onClick: () => toast.info("文字游戏创作功能开发中，敬请期待。"),
          },
          {
            icon: TbFileImport,
            label: "导入作品",
            onClick: () => ImportNovelPanel.open(),
          },
        ]}
      />

      <div className="flex-1 overflow-hidden">
        {works.length === 0 ? (
          <div className="px-3 py-4 text-xs text-muted-foreground">
            当前世界观暂无关联作品，先创建或导入一个吧。
          </div>
        ) : (
          works.map((work) => {
            const subtitle = `更新于 ${formatDate(work.updated_at)}`;
            const isActive = currentNovelId === work.id;
            const isOpening = openingId === work.id;

            return (
              <div
                key={work.id}
                className={cn(
                  "group flex w-full items-center gap-1 rounded-md px-3 py-2 transition-colors",
                  "hover:bg-muted/60",
                  isActive && "bg-primary/5 text-primary hover:bg-primary/10",
                  isOpening && "opacity-60 pointer-events-none"
                )}
              >
                <button
                  className="flex flex-col items-start gap-1 text-left flex-1 min-w-0"
                  onClick={() => handleOpenWork(work)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm font-medium truncate flex-1">
                      {work.name || "未命名作品"}
                    </span>
                    {isOpening && (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        打开中...
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground/80 truncate w-full">
                    {subtitle || "未关联世界观"}
                  </span>
                </button>
                {/* 只在当前打开的作品上显示操作菜单 */}
                {
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <TbDots className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          NovelNameEdit.open();
                        }}
                      >
                        <TbPencil className="h-4 w-4" />
                        <span>重命名</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          NovelExportTxtPanel.open();
                        }}
                      >
                        <TbFileExport className="h-4 w-4" />
                        <span>导出</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNovel(work);
                        }}
                      >
                        <TbTrash className="h-4 w-4" />
                        <span>删除</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
