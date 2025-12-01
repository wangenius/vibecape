import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useVibecapeStore } from "../useVibecapeStore";
import { VibecapeEditor } from "./VibecapeEditor";
import {
  FolderOpen,
  Download,
  Upload,
  Loader2,
  FileText,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

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

// 工具栏
const Toolbar = ({
  title,
  onImport,
  onExport,
  loading,
}: {
  title: string;
  onImport: () => void;
  onExport: () => void;
  loading: boolean;
}) => (
  <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
    <span className="text-sm text-muted-foreground flex-1 truncate">
      {title}
    </span>
    <Button
      variant="ghost"
      size="sm"
      onClick={onImport}
      disabled={loading}
      className="h-7 text-xs"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
      ) : (
        <Download className="h-3 w-3 mr-1" />
      )}
      导入
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={onExport}
      disabled={loading}
      className="h-7 text-xs"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
      ) : (
        <Upload className="h-3 w-3 mr-1" />
      )}
      导出
    </Button>
  </div>
);

export const VibecapeWorkspace = () => {
  const workspace = useVibecapeStore((state) => state.workspace);
  const activeDoc = useVibecapeStore((state) => state.activeDoc);
  const loading = useVibecapeStore((state) => state.loading);
  const bootstrap = useVibecapeStore((state) => state.bootstrap);
  const saveDoc = useVibecapeStore((state) => state.saveDoc);
  const importFromDocs = useVibecapeStore((state) => state.importFromDocs);
  const exportToDocs = useVibecapeStore((state) => state.exportToDocs);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const handleImport = async () => {
    try {
      const result = await importFromDocs();
      toast.success(`成功导入 ${result.imported} 个文档`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportToDocs();
      toast.success(`成功导出 ${result.exported} 个文档`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // 未初始化工作区 - 显示欢迎页面
  if (!workspace?.initialized) {
    return <WelcomePage />;
  }

  // 未选择文档
  if (!activeDoc) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <Toolbar
          title={workspace.root.split("/").pop() || "工作区"}
          onImport={handleImport}
          onExport={handleExport}
          loading={loading}
        />
        <EmptyDocState />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center gap-2 p-4 border-b">
        <span className="text-sm text-muted-foreground flex-1 truncate">
          {activeDoc.slug}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleImport}
          disabled={loading || !workspace.docsPath}
          title={workspace.docsPath ? "从 docs 目录导入" : "未找到 docs 目录"}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1" />
          )}
          导入
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-1" />
          )}
          导出
        </Button>
      </div>

      {/* 编辑器 */}
      <VibecapeEditor doc={activeDoc} onSave={saveDoc} />
    </div>
  );
};
