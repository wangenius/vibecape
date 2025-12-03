import { Button } from "@/components/ui/button";
import { useVibecapeStore } from "@/hook/useVibecapeStore";
import { useViewManager, setSidebarViewMode } from "@/hook/app/useViewManager";
import { Loader2, X, Download, Upload, Plus, FolderOpen } from "lucide-react";
import { TbDots } from "react-icons/tb";
import { ViewModeSwitch } from "./ViewModeSwitch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dialog } from "@/components/custom/DialogModal";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface SidebarHeaderProps {
  onCreateDoc: (parentId: string | null) => void;
}

export const SidebarHeader = ({ onCreateDoc }: SidebarHeaderProps) => {
  const { t } = useTranslation();
  const workspace = useVibecapeStore((state) => state.workspace);
  const loading = useVibecapeStore((state) => state.loading);
  const closeWorkspace = useVibecapeStore((state) => state.closeWorkspace);
  const importFromDocs = useVibecapeStore((state) => state.importFromDocs);
  const exportToDocs = useVibecapeStore((state) => state.exportToDocs);
  const sidebarViewMode = useViewManager((state) => state.sidebarViewMode);

  // 未打开工作区时不显示头部
  if (!workspace?.initialized) {
    return null;
  }

  const handleImport = () => {
    dialog.confirm({
      title: t("common.settings.importFromDocs"),
      content: (
        <p className="text-sm text-muted-foreground">
          {t("common.settings.importFromDocsDesc")}
          <br />
          <strong className="text-destructive">
            {t("common.settings.importWarning")}
          </strong>
        </p>
      ),
      okText: t("common.settings.confirmImport"),
      variants: "destructive",
      onOk: async () => {
        try {
          const result = await importFromDocs();
          toast.success(
            t("common.settings.importSuccess", { count: result.imported })
          );
        } catch (error: any) {
          toast.error(error?.message ?? t("common.settings.importFailed"));
        }
      },
    });
  };

  const handleExport = () => {
    dialog.confirm({
      title: t("common.settings.exportToDocs"),
      content: (
        <p className="text-sm text-muted-foreground">
          {t("common.settings.exportToDocsDesc")}
          <br />
          <strong className="text-destructive">
            {t("common.settings.exportWarning")}
          </strong>
        </p>
      ),
      okText: t("common.settings.confirmExport"),
      variants: "destructive",
      onOk: async () => {
        try {
          const result = await exportToDocs();
          toast.success(
            t("common.settings.exportSuccess", { count: result.exported })
          );
        } catch (error: any) {
          toast.error(error?.message ?? t("common.settings.exportFailed"));
        }
      },
    });
  };

  return (
    <div className="px-1 w-full shrink-0">
      <div className="flex items-center gap-1 whitespace-nowrap">
        {/* 左侧：Switch 切换按钮 */}
        <ViewModeSwitch
          mode={sidebarViewMode}
          onModeChange={setSidebarViewMode}
        />
        <div className="flex-1"></div>

        {/* 右侧：新建 + 更多操作 */}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 hover:bg-muted-foreground/10"
          onClick={() => onCreateDoc(null)}
          title={t("common.settings.newDoc")}
        >
          <Plus className="size-3.5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted-foreground/10"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <TbDots className="size-3.5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleImport}>
              <Download className="size-3.5" />
              {t("common.settings.importFromDocs")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport}>
              <Upload className="size-3.5" />
              {t("common.settings.exportToDocs")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void window.api.vibecape.openInFinder()}
            >
              <FolderOpen className="size-3.5" />
              {t("common.settings.openInFinder")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => void closeWorkspace()}
            >
              <X className="size-3.5 stroke-destructive" />
              {t("common.settings.closeWorkspace")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
