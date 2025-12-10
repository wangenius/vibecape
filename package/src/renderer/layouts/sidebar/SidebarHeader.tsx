import { Button } from "@/components/ui/button";
import {
  useRepositoryStore,
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

export const SidebarHeader = () => {
  const { t } = useTranslation();
  const repository = useRepositoryStore((state) => state.repository);
  const closeRepository = useRepositoryStore((state) => state.closeRepository);
  const refreshTree = useDocumentStore((state) => state.refreshTree);
  const loading = useUIStore((state) => state.loading);

  // 未打开工作区时不显示头部
  if (!repository) {
    return null;
  }

  const handleImportMarkdown = async () => {
    const result = await window.api.vibecape.importMarkdownFile();
    if (result.count > 0) {
      toast.success(
        t("common.repository.importSuccess", { count: result.count })
      );
      await refreshTree();
    }
  };

  const handleImportDirectory = async () => {
    const result = await window.api.vibecape.importDirectory();
    if (result.count > 0) {
      toast.success(
        t("common.repository.importSuccess", { count: result.count })
      );
      await refreshTree();
    }
  };

  const handleImportVibecapeDb = async () => {
    const result = await window.api.vibecape.importVibecapeDb();
    if (result.count > 0) {
      toast.success(
        t("common.repository.importSuccess", { count: result.count })
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
        {/* 视图模式切换（仅在有 repository 时显示） */}
        {repository && (
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
          onClick={() => {}}
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
                {t("common.repository.import")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={handleImportDirectory}>
                  <FolderOpen />
                  {t("common.repository.importDirectory")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportMarkdown}>
                  <FileText />
                  {t("common.repository.importMarkdown")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportVibecapeDb}>
                  <Database />
                  {t("common.repository.importVibecape")}
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
              onClick={() => void closeRepository()}
            >
              <X />
              {t("common.settings.closeRepository")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
