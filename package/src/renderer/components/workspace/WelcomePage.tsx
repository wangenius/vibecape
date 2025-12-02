import { Button } from "@/components/ui/button";
import { useVibecapeStore } from "@/hook/useVibecapeStore";
import { FolderOpen, Loader2, FileText, Sparkles } from "lucide-react";
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
    <div className="flex-1 flex flex-col items-center justify-center bg-linear-to-b from-background to-muted/20">
      <div className="flex flex-col items-center gap-8 max-w-md px-6">
        {/* Logo / Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-10 h-10 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-primary-foreground" />
          </div>
        </div>

        {/* 标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Vibecape</h1>
          <p className="text-muted-foreground">
            为 Fumadocs 打造的可视化文档编辑器
          </p>
        </div>

        {/* 功能介绍 */}
        <div className="w-full space-y-3">
          {[
            { icon: "📝", text: "可视化编辑 MDX 文档" },
            { icon: "🔄", text: "与 Fumadocs 双向同步" },
            { icon: "📂", text: "智能管理文档结构" },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.text}</span>
            </div>
          ))}
        </div>

        {/* 操作按钮 */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleOpenWorkspace}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FolderOpen className="h-4 w-4 mr-2" />
          )}
          打开 docs 目录
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          选择你的 Fumadocs 项目中的 docs 目录
          <br />
          Vibecape 将在其中创建 .vibecape 工作区
        </p>
      </div>
    </div>
  );
};
