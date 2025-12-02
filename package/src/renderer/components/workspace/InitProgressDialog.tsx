import { useVibecapeStore } from "@/hook/useVibecapeStore";
import { Loader2 } from "lucide-react";

export const InitProgressDialog = () => {
  const initProgress = useVibecapeStore((state) => state.initProgress);

  if (!initProgress) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-lg p-6 shadow-lg max-w-sm w-full mx-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center space-y-1">
            <p className="font-medium">初始化工作区</p>
            <p className="text-sm text-muted-foreground">{initProgress}</p>
          </div>
          {/* 进度条 */}
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
