import { Button } from "@/components/ui/button";
import { useVibecapeStore } from "@/hook/useVibecapeStore";
import { Loader2, X, Download, Upload, Plus } from "lucide-react";
import { TbDots } from "react-icons/tb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dialog } from "@/components/custom/DialogModal";
import { toast } from "sonner";

interface SidebarHeaderProps {
  onCreateDoc: (parentId: string | null) => void;
}

export const SidebarHeader = ({ onCreateDoc }: SidebarHeaderProps) => {
  const workspace = useVibecapeStore((state) => state.workspace);
  const loading = useVibecapeStore((state) => state.loading);
  const closeWorkspace = useVibecapeStore((state) => state.closeWorkspace);
  const importFromDocs = useVibecapeStore((state) => state.importFromDocs);
  const exportToDocs = useVibecapeStore((state) => state.exportToDocs);

  // 未打开工作区时不显示头部
  if (!workspace?.initialized) {
    return null;
  }

  const handleImport = () => {
    dialog.confirm({
      title: "从 docs 导入",
      content: (
        <p className="text-sm text-muted-foreground">
          将从 docs 目录导入所有 MDX 文件到数据库。
          <br />
          <strong className="text-destructive">
            注意：这将覆盖数据库中的现有文档。
          </strong>
        </p>
      ),
      okText: "确认导入",
      variants: "destructive",
      onOk: async () => {
        try {
          const result = await importFromDocs();
          toast.success(`成功导入 ${result.imported} 个文档`);
        } catch (error: any) {
          toast.error(error?.message ?? "导入失败");
        }
      },
    });
  };

  const handleExport = () => {
    dialog.confirm({
      title: "导出到 docs",
      content: (
        <p className="text-sm text-muted-foreground">
          将数据库中的文档导出到 docs 目录。
          <br />
          <strong className="text-destructive">
            注意：这将覆盖 docs 目录中的现有文件。
          </strong>
        </p>
      ),
      okText: "确认导出",
      variants: "destructive",
      onOk: async () => {
        try {
          const result = await exportToDocs();
          toast.success(`成功导出 ${result.exported} 个文档`);
        } catch (error: any) {
          toast.error(error?.message ?? "导出失败");
        }
      },
    });
  };

  return (
    <div className="px-2">
      <div className="flex items-center gap-1">
        {/* 左侧：目录名称 */}
        <div className="flex-1 flex items-center gap-2 min-w-0 px-2">
          <span className="text-sm truncate text-muted-foreground">
            {workspace.root.split("/").pop()}
          </span>
        </div>

        {/* 右侧：新建 + 更多操作 */}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 hover:bg-muted-foreground/10"
          onClick={() => onCreateDoc(null)}
          title="新建文档"
        >
          <Plus className="size-3.5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted-foreground/10"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <TbDots className="size-3.5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleImport}>
              <Download className="size-3.5" />从 docs 导入
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport}>
              <Upload className="size-3.5" />
              导出到 docs
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => void closeWorkspace()}
            >
              <X className="size-3.5 stroke-destructive" />
              关闭工作区
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
