import { Button } from "@/components/ui/button";
import {
  useWorkspaceStore,
  useDocumentStore,
  useUIStore,
} from "@/hooks/stores";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ViewModeSwitch } from "./ViewModeSwitch";
import { setSidebarViewMode, useViewManager } from "@/hooks/app/useViewManager";

interface SidebarHeaderProps {
  onCreateDoc: (parentId: string | null) => void;
}

export const SidebarHeader = ({ onCreateDoc }: SidebarHeaderProps) => {
  const { t } = useTranslation();
  const workspace = useWorkspaceStore((state) => state.workspace);
  const closeWorkspace = useWorkspaceStore((state) => state.closeWorkspace);
  const refreshTree = useDocumentStore((state) => state.refreshTree);
  const loading = useUIStore((state) => state.loading);

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

  const sidebarViewMode = useViewManager(
    (selector) => selector.sidebarViewMode
  );
  return (
    <div className="p-1 w-full shrink-0">
      <div className="flex items-center gap-1 whitespace-nowrap">
        {/* 视图模式切换（仅在有 workspace 时显示） */}
        {workspace && (
          <ViewModeSwitch
            mode={sidebarViewMode}
            onModeChange={setSidebarViewMode}
          />
        )}
        <div className="flex-1"></div>
        {/* 右侧：新建 + 更多操作 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCreateDoc(null)}
          title={t("common.settings.newDoc")}
        >
          <Plus />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <TbDots />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* 导入子菜单 */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput />
                {t("common.workspace.import")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={handleImportDirectory}>
                  <FolderOpen />
                  {t("common.workspace.importDirectory")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportMarkdown}>
                  <FileText />
                  {t("common.workspace.importMarkdown")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportVibecapeDb}>
                  <Database />
                  {t("common.workspace.importVibecape")}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem
              onClick={() => void window.api.vibecape.openInFinder()}
            >
              <FolderOpen />
              {t("common.settings.openInFinder")}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => void closeWorkspace()}
            >
              <X />
              {t("common.settings.closeWorkspace")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
