import { Button } from "@/components/ui/button";
import { useVibecapeStore } from "@/hook/useVibecapeStore";
import { Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

export const WelcomePage = () => {
  const loading = useVibecapeStore((state) => state.loading);
  const openWorkspace = useVibecapeStore((state) => state.openWorkspace);

  const handleOpenWorkspace = async () => {
    try {
      const result = await openWorkspace();
      if (result) {
        toast.success("工作区已就绪");
      }
    } catch (error) {
      toast.error((error as Error).message || "初始化失败");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background select-none">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Vibecape
          </h1>
          <p className="text-sm text-muted-foreground">
            Fumadocs Visual Editor
          </p>
        </div>

        <Button
          size="default"
          className="min-w-[140px]"
          onClick={handleOpenWorkspace}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FolderOpen className="h-4 w-4 mr-2" />
          )}
          Open Workspace
        </Button>
      </div>
    </div>
  );
};
