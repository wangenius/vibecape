import { FileText } from "lucide-react";

export const EmptyDocState = () => (
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
