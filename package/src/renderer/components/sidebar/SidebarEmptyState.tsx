import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useVibecapeStore } from "@/hook/useVibecapeStore";
import { Loader2, FolderOpen, Clock3, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const SidebarEmptyState = () => {
  const { t } = useTranslation();
  const loading = useVibecapeStore((state) => state.loading);
  const openWorkspace = useVibecapeStore((state) => state.openWorkspace);
  const openWorkspaceFromHistory = useVibecapeStore(
    (state) => state.openWorkspaceFromHistory
  );
  const workspaceHistory = useVibecapeStore(
    (state) => state.workspaceHistory
  );
  const historyLoading = useVibecapeStore((state) => state.historyLoading);
  const loadWorkspaceHistory = useVibecapeStore(
    (state) => state.loadWorkspaceHistory
  );
  const removeWorkspaceFromHistory = useVibecapeStore(
    (state) => state.removeWorkspaceFromHistory
  );

  useEffect(() => {
    void loadWorkspaceHistory();
  }, [loadWorkspaceHistory]);

  const handleOpenWorkspace = async () => {
    try {
      const result = await openWorkspace();
      if (result) {
        toast.success(t("common.workspace.workspaceReady"));
      }
    } catch (error) {
      toast.error(
        (error as Error).message || t("common.workspace.initializationFailed")
      );
    }
  };

  const handleOpenRecent = async (docsDir: string) => {
    try {
      const result = await openWorkspaceFromHistory(docsDir);
      if (result) {
        toast.success(t("common.workspace.workspaceReady"));
      }
    } catch (error) {
      toast.error(
        (error as Error).message || t("common.workspace.initializationFailed")
      );
    }
  };

  const handleRemove = async (docsDir: string) => {
    await removeWorkspaceFromHistory(docsDir);
    toast.success(t("common.workspace.removedFromHistory"));
  };

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleString();

  return (
    <div className="flex-1 flex flex-col items-center justify-center select-none">
      <div className="flex flex-col items-center gap-6 max-w-xl text-center justify-center m-auto h-full pb-40 w-full">
        <div className="space-y-2 flex flex-col items-center gap-4">
          <img
            src="/new-macOS-Default-1024x1024@2x.png"
            alt=""
            className="size-16"
          />
          <Button
            size="default"
            className="min-w-[140px] hover:bg-primary/20"
            onClick={handleOpenWorkspace}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FolderOpen className="h-4 w-4" />
            )}
            {t("common.workspace.openWorkspace")}
          </Button>
        </div>
        <div className="w-full max-w-xl">
          <div className="flex items-center justify-between pb-2">
            <div className="text-sm font-medium flex items-center gap-2">
              {t("common.workspace.recentTitle")}
              {historyLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => void loadWorkspaceHistory()}
              disabled={historyLoading}
            >
              {t("common.workspace.refreshHistory")}
            </Button>
          </div>
          {workspaceHistory.length === 0 ? (
            <div className="text-sm text-muted-foreground text-left">
              {t("common.workspace.noHistory")}
            </div>
          ) : (
            <div className="space-y-2">
              {workspaceHistory.map((item) => (
                <div
                  key={item.path}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 hover:border-border transition"
                >
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {item.name}
                      </span>
                      {!item.exists && (
                        <span className="text-[10px] text-destructive">
                          {t("common.workspace.missing")}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {item.path}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      <span>
                        {t("common.workspace.lastOpened", {
                          time: formatTime(item.lastOpenedAt),
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={!item.exists || loading}
                      title={t("common.workspace.openRecent")}
                      onClick={() => void handleOpenRecent(item.path)}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={t("common.workspace.removeRecent")}
                      onClick={() => void handleRemove(item.path)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
