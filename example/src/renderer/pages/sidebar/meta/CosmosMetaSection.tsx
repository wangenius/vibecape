import { closeCosmos, deleteCosmos, exportCosmos, useCosmos } from "@/hook/cosmos/useCosmos";
import {
  openCosmosDetailTab,
  openCosmosGraphTab,
  openCosmosStoryGraphTab,
} from "@/hook/app/useViewManager";
import { Button } from "@/components/ui/button";
import {
  TbInfoCircle,
  TbFileExport,
  TbArrowLeftFromArc,
  TbTopologyRing3,
  TbTopologyStar,
  TbTrash,
} from "react-icons/tb";
import { dialog } from "@/components/custom/DialogModal";
import { toast } from "sonner";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
}

const MenuItem = ({
  icon,
  label,
  onClick,
  variant = "default",
}: MenuItemProps) => {
  return (
    <Button
      variant="ghost"
      className={`w-full justify-start gap-3 h-10 hover:bg-muted-foreground/10 ${
        variant === "destructive"
          ? "text-destructive hover:text-destructive"
          : ""
      }`}
      onClick={onClick}
    >
      <span className="text-base">{icon}</span>
      <span className="text-sm">{label}</span>
    </Button>
  );
};

/**
 * 世界观信息
 */
export const CosmosMetaSection = () => {
  const cosmos = useCosmos((state) => state.current_meta);
  const meta = cosmos;

  const handleOpenDetail = () => {
    openCosmosDetailTab();
  };

  const handleOpenGraph = () => {
    openCosmosGraphTab();
  };

  const handleOpenStoryGraph = () => {
    openCosmosStoryGraphTab();
  };

  const handleExport = async () => {
    if (!meta?.id) return;
    try {
      await exportCosmos(meta.id);
    } catch (error) {
      console.error("导出失败:", error);
    }
  };

  const handleCloseCosmos = async () => {
    try {
      await closeCosmos();
    } catch (error) {
      console.error("关闭世界观失败:", error);
      toast.error("关闭世界观失败");
    }
  };

  const handleDeleteCosmos = () => {
    if (!meta?.id) return;
    dialog.confirm({
      title: "删除世界观",
      content: `确定要删除世界观「${meta.name || "未命名"}」吗？此操作不可撤销。`,
      variants: "destructive",
      okText: "删除",
      onOk: async () => {
        try {
          await deleteCosmos(meta.id);
          toast.success("世界观已删除");
        } catch (error) {
          console.error("删除世界观失败:", error);
          toast.error("删除世界观失败");
        }
      },
    });
  };

  if (!meta) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        未打开世界观
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 操作列表 */}
      <div className="flex-1 overflow-y-auto space-y-1">
        <MenuItem
          icon={<TbInfoCircle />}
          label="信息"
          onClick={handleOpenDetail}
        />

        <MenuItem
          icon={<TbTopologyRing3 />}
          label="角色图谱"
          onClick={handleOpenGraph}
        />

        <MenuItem
          icon={<TbTopologyStar />}
          label="剧情图谱"
          onClick={handleOpenStoryGraph}
        />

        <MenuItem icon={<TbFileExport />} label="导出" onClick={handleExport} />
        <MenuItem
          icon={<TbArrowLeftFromArc />}
          label="离开"
          onClick={handleCloseCosmos}
        />
        <MenuItem
          icon={<TbTrash />}
          label="删除"
          onClick={handleDeleteCosmos}
          variant="destructive"
        />
      </div>
    </div>
  );
};
