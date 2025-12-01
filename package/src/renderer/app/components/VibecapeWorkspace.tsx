import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useVibecapeStore } from "../useVibecapeStore";
import { VibecapeEditor } from "./VibecapeEditor";
import { FolderOpen, Loader2, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useViewManager } from "@/hook/app/useViewManager";
import { GeneralSettings, ModelSettings, AboutSettings } from "./SettingsModal";

// 初始化进度对话框
const InitProgressDialog = () => {
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

// 欢迎页面 - 未打开工作区时显示
const WelcomePage = () => {
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

// 空文档状态
const EmptyDocState = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-6">
    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
      <FileText className="w-8 h-8 text-muted-foreground" />
    </div>
    <div className="space-y-1">
      <div className="text-lg font-medium">选择一个文档</div>
      <div className="text-sm text-muted-foreground">
        从左侧边栏选择文档开始编辑，或点击 + 创建新文档
      </div>
    </div>
  </div>
);

export const VibecapeWorkspace = () => {
  const workspace = useVibecapeStore((state) => state.workspace);
  const activeDoc = useVibecapeStore((state) => state.activeDoc);
  const bootstrap = useVibecapeStore((state) => state.bootstrap);
  const saveDoc = useVibecapeStore((state) => state.saveDoc);
  const activeSidebarPanel = useViewManager((state) => state.activeSidebarPanel);
  const settingsSection = useViewManager((state) => state.previewCosmosId);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // 设置模式 - 显示设置页面
  if (activeSidebarPanel === "settings") {
    const renderSettings = () => {
      switch (settingsSection) {
        case "models":
          return <ModelSettings />;
        case "about":
          return <AboutSettings />;
        case "general":
        default:
          return <GeneralSettings />;
      }
    };

    return (
      <div className="h-full overflow-auto p-6">
        <div className="max-w-3xl mx-auto">{renderSettings()}</div>
      </div>
    );
  }

  // 未初始化工作区 - 显示欢迎页面
  if (!workspace?.initialized) {
    return (
      <>
        <InitProgressDialog />
        <WelcomePage />
      </>
    );
  }

  // 未选择文档
  if (!activeDoc) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <EmptyDocState />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* 编辑器 */}
      <VibecapeEditor doc={activeDoc} onSave={saveDoc} />
    </div>
  );
};
