import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore, useUIStore } from "@/hooks/stores";
import { Loader2, Trash2, Plus, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { dialog } from "@/components/custom/DialogModal";
import { TbCheck, TbX } from "react-icons/tb";
import { cn } from "@/lib/utils";

export const SidebarEmptyState = () => {
  const { t } = useTranslation();
  const loading = useUIStore((state) => state.loading);
  const listLoading = useUIStore((state) => state.listLoading);
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const openWorkspace = useWorkspaceStore((state) => state.openWorkspace);
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace);

  const handleOpenWorkspace = async (id: string) => {
    try {
      await openWorkspace(id);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDeleteWorkspace = async (id: string, name: string) => {
    dialog.confirm({
      title: t("common.workspace.deleteWorkspace"),
      content: (
        <p className="text-sm text-muted-foreground">
          {t("common.workspace.deleteConfirm", { name })}
        </p>
      ),
      variants: "destructive",
      okText: t("common.delete"),
      onOk: async () => {
        try {
          await deleteWorkspace(id);
          toast.success(t("common.workspace.workspaceDeleted"));
        } catch (error) {
          toast.error((error as Error).message);
        }
      },
    });
  };

  const handleCreateWorkspace = () => {
    let inputValue = "";

    dialog({
      title: t("common.workspace.createWorkspace"),
      className: "max-w-[400px]",
      content: (close) => (
        <div className="space-y-4">
          <Input
            placeholder={t("common.workspace.workspaceName")}
            onChange={(e) => {
              inputValue = e.target.value;
            }}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && inputValue.trim()) {
                try {
                  const result = await createWorkspace(inputValue.trim());
                  if (result) {
                    toast.success(t("common.workspace.workspaceCreated"));
                    close();
                  }
                } catch (error) {
                  toast.error((error as Error).message);
                }
              }
            }}
            autoFocus
          />
        </div>
      ),
      footer: (close) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={close}>
            <TbX className="w-4 h-4" />
            {t("common.cancel")}
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              if (!inputValue.trim()) return;
              try {
                const result = await createWorkspace(inputValue.trim());
                if (result) {
                  toast.success(t("common.workspace.workspaceCreated"));
                  close();
                }
              } catch (error) {
                toast.error((error as Error).message);
              }
            }}
          >
            <TbCheck className="w-4 h-4" />
            {t("common.create")}
          </Button>
        </div>
      ),
    });
  };

  return (
    <div className="flex-1 flex flex-col select-none p-3 overflow-hidden">
      {/* 顶部新建按钮 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">
          {t("common.workspace.recentTitle")}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1"
          onClick={handleCreateWorkspace}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {t("common.workspace.createWorkspace")}
        </Button>
      </div>

      {/* 工作区列表 */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {listLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : workspaceList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {t("common.workspace.noHistory")}
            </p>
          </div>
        ) : (
          workspaceList.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer",
                "hover:bg-muted/60 transition-colors"
              )}
              onClick={() => void handleOpenWorkspace(item.id)}
            >
              <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.name}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDeleteWorkspace(item.id, item.name);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
