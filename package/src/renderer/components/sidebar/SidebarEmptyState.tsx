import { Folder } from "lucide-react";

export const SidebarEmptyState = () => (
  <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
    <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
      <Folder className="w-6 h-6 text-muted-foreground" />
    </div>
    <p className="text-sm text-muted-foreground">打开 docs 目录开始使用</p>
  </div>
);
