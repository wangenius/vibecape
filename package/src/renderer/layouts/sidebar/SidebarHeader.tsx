import { Button } from "@/components/ui/button";
import { useWorkspaceStore, useDocumentStore, useUIStore } from "@/hooks/stores";
import { useViewManager, setSidebarViewMode } from "@/hooks/app/useViewManager";
import {
  Loader2,
  X,
  Plus,
  FolderOpen,
  FileText,
  FolderInput,
  Database,
} from "lucide-react";
import { TbDots } from "react-icons/tb";
import { ViewModeSwitch } from "./ViewModeSwitch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface SidebarHeaderProps {
  onCreateDoc: (parentId: string | null) => void;
}

export const SidebarHeader = ({ onCreateDoc }: SidebarHeaderProps) => {
  const { t } = useTranslation();
  const workspace = useWorkspaceStore((state) => state.workspace);
  const closeWorkspace = useWorkspaceStore((state) => state.closeWorkspace);
  const refreshTree = useDocumentStore((state) => state.refreshTree);
  const loading = useUIStore((state) => state.loading);
  const sidebarViewMode = useViewManager((state) => state.sidebarViewMode);

  // 未打开工作区时不显示头部
  if (!workspace) {
    return null;
  }

  const handleImportMarkdown = async () => {
    const result = await window.api.vibecape.importMarkdownFile();
    if (result.count > 0) {
      toast.success(
        t("common.workspace.importSuccess", { count: result.count })
      );
      await refreshTree();
    }
  };

  const handleImportDirectory = async () => {
    const result = await window.api.vibecape.importDirectory();
    if (result.count > 0) {
      toast.success(
        t("common.workspace.importSuccess", { count: result.count })
      );
      await refreshTree();
    }
  };

  const handleImportVibecapeDb = async () => {
    const result = await window.api.vibecape.importVibecapeDb();
    if (result.count > 0) {
      toast.success(
        t("common.workspace.importSuccess", { count: result.count })
      );
      await refreshTree();
    }
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
            {/* 导入子菜单 */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput className="size-3.5" />
                {t("common.workspace.import")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={handleImportDirectory}>
                  <FolderOpen className="size-3.5" />
                  {t("common.workspace.importDirectory")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportMarkdown}>
                  <FileText className="size-3.5" />
                  {t("common.workspace.importMarkdown")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportVibecapeDb}>
                  <Database className="size-3.5" />
                  {t("common.workspace.importVibecape")}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
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
