import { Button } from "@/components/ui/button";
import { useVibecapeStore } from "@/hook/useVibecapeStore";
import { Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const SidebarEmptyState = () => {
  const { t } = useTranslation();
  const loading = useVibecapeStore((state) => state.loading);
  const openWorkspace = useVibecapeStore((state) => state.openWorkspace);

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
  return (
    <div className="flex-1 flex flex-col items-center justify-center select-none">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center justify-center m-auto h-full pb-60">
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
      </div>
    </div>
  );
};
