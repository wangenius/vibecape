import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVibecapeStore } from "../useVibecapeStore";
import type { DocTreeNode } from "@common/schema/docs";
import {
  ChevronRight,
  Folder,
  Loader2,
  RefreshCcw,
  Trash2,
  FilePlus,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useViewManager } from "@/hook/app/useViewManager";
import { TbScript, TbDots } from "react-icons/tb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dialog } from "@/components/custom/DialogModal";
import { toast } from "sonner";

const INDENT_WIDTH = 24;

// 节点样式
const nodeBaseStyles = {
  base: cn(
    "group relative flex items-center gap-2 py-1 pl-1 pr-1 rounded-lg mx-1",
    "transition-all duration-200 ease-out",
    "cursor-pointer",
    "border border-transparent",
    "hover:bg-muted-foreground/5"
  ),
  selected: ["bg-primary/5 hover:bg-primary/8"],
};

// 树节点组件
interface TreeNodeProps {
  node: DocTreeNode;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  selected: boolean;
  onClick: () => void;
  onCreateDoc: (parentId: string | null) => void;
  onDelete: (node: DocTreeNode) => void;
}

const TreeNode = memo(
  ({
    node,
    level,
    isExpanded,
    onToggle,
    selected,
    onClick,
    onCreateDoc,
    onDelete,
  }: TreeNodeProps) => {
    const hasChildren = (node.children?.length ?? 0) > 0;

    const nodeStyles = cn(
      nodeBaseStyles.base,
      selected && nodeBaseStyles.selected
    );

    const handleClick = useCallback(() => {
      onClick();
    }, [onClick]);

    const handleToggle = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle();
      },
      [onToggle]
    );

    return (
      <div style={{ paddingLeft: level * INDENT_WIDTH }} className="relative">
        {/* 树形连接线 */}
        {level > 0 && (
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0",
              "border-l border-dashed border-border/15",
              "group-hover:border-primary/20 transition-colors duration-200"
            )}
            style={{ left: level * INDENT_WIDTH - 12 }}
          />
        )}

        <div className={nodeStyles} onClick={handleClick}>
          {/* 展开/折叠图标 */}
          <div className="flex items-center gap-1 touch-none select-none hover:bg-muted-foreground/10 rounded-md">
            {hasChildren ? (
              <ChevronRight
                className={cn(
                  "h-6 w-6 rounded-md p-1",
                  "transition-all duration-200",
                  "text-primary",
                  isExpanded && "transform rotate-90 text-primary"
                )}
                onClick={handleToggle}
              />
            ) : hasChildren ? (
              <Folder
                className={cn(
                  "h-6 w-6 rounded-md p-1",
                  "text-primary",
                  selected && "text-primary"
                )}
              />
            ) : (
              <TbScript
                className={cn(
                  "h-6 w-6 rounded-md p-1",
                  "text-primary",
                  selected && "text-primary"
                )}
              />
            )}
          </div>

          {/* 节点标题 */}
          <div
            className={cn(
              "flex-1 min-w-0 text-[13px] truncate",
              "text-foreground",
              "transition-colors duration-200",
              selected && "text-foreground font-medium"
            )}
          >
            {node.title}
          </div>

          {/* 右侧操作菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-6 w-6 p-1 rounded-md opacity-0 group-hover:opacity-100",
                  "hover:bg-primary/10",
                  "transition-opacity duration-200 data-[state=open]:opacity-100"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <TbDots className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem onClick={() => onCreateDoc(node.id)}>
                <FilePlus className="h-4 w-4 mr-2" />
                新建子文档
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(node)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }
);

TreeNode.displayName = "TreeNode";

// 侧边栏头部
const SidebarHeader = () => {
  const workspace = useVibecapeStore((state) => state.workspace);
  const loading = useVibecapeStore((state) => state.loading);
  const closeWorkspace = useVibecapeStore((state) => state.closeWorkspace);
  const refreshTree = useVibecapeStore((state) => state.refreshTree);

  // 未打开工作区时不显示头部
  if (!workspace?.initialized) {
    return null;
  }

  return (
    <div className="p-3 border-b border-border/30 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">工作区</div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => void refreshTree()}
            disabled={loading}
            title="刷新"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCcw className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-destructive"
            onClick={() => void closeWorkspace()}
            disabled={loading}
            title="关闭工作区"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="text-sm font-medium truncate text-foreground/80">
        {workspace.root.split("/").pop()}
      </div>
    </div>
  );
};

// 侧边栏空状态
const SidebarEmptyState = () => (
  <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
    <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
      <Folder className="w-6 h-6 text-muted-foreground" />
    </div>
    <p className="text-sm text-muted-foreground">
      打开 docs 目录开始使用
    </p>
  </div>
);

// 文档树视图
const DocTreeView = () => {
  const tree = useVibecapeStore((state) => state.tree);
  const activeDocId = useVibecapeStore((state) => state.activeDocId);
  const openDoc = useVibecapeStore((state) => state.openDoc);
  const createDoc = useVibecapeStore((state) => state.createDoc);
  const deleteDoc = useVibecapeStore((state) => state.deleteDoc);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  );

  // 切换展开/折叠
  const handleToggleExpanded = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  }, []);

  // 选择节点
  const handleNodeSelect = useCallback(
    (node: DocTreeNode) => {
      void openDoc(node.id);
      if (node.children && node.children.length > 0) {
        handleToggleExpanded(node.id);
      }
    },
    [openDoc, handleToggleExpanded]
  );

  // 新建文档
  const handleCreateDoc = useCallback(
    (parentId: string | null) => {
      let slug = "";
      let title = "";
      dialog({
        title: "新建文档",
        content: () => (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">文件名 (slug)</label>
              <Input
                placeholder="例如: getting-started"
                onChange={(e) => (slug = e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">标题</label>
              <Input
                placeholder="例如: 快速开始"
                onChange={(e) => (title = e.target.value)}
              />
            </div>
          </div>
        ),
        footer: (close) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>
              取消
            </Button>
            <Button
              onClick={async () => {
                if (!slug.trim()) {
                  toast.error("请输入文件名");
                  return;
                }
                try {
                  await createDoc({
                    parent_id: parentId,
                    slug: slug.trim(),
                    title: title.trim() || slug.trim(),
                  });
                  toast.success("文档已创建");
                  close();
                } catch (error: any) {
                  toast.error(error?.message ?? "创建失败");
                }
              }}
            >
              创建
            </Button>
          </div>
        ),
        className: "max-w-md",
      });
    },
    [createDoc]
  );

  // 删除文档
  const handleDelete = useCallback(
    (node: DocTreeNode) => {
      const hasChildren = (node.children?.length ?? 0) > 0;
      dialog.confirm({
        title: "确认删除",
        content: (
          <p>
            确定要删除 <strong>{node.title}</strong> 吗？
            {hasChildren && "该文档下的所有子文档也会被删除。"}
          </p>
        ),
        okText: "删除",
        cancelText: "取消",
        variants: "destructive",
        onOk: async () => {
          try {
            await deleteDoc(node.id);
            toast.success("已删除");
          } catch (error: any) {
            toast.error(error?.message ?? "删除失败");
          }
        },
      });
    },
    [deleteDoc]
  );

  // 递归渲染树
  const renderDocTree = useCallback(
    (nodes: DocTreeNode[], level = 0) => {
      return nodes.map((node) => {
        const children = node.children ?? [];
        const isExpanded = expandedNodes[node.id] ?? false;

        return (
          <div key={node.id} className="space-y-0.5 overflow-x-hidden">
            <TreeNode
              node={node}
              level={level}
              isExpanded={isExpanded}
              onToggle={() => handleToggleExpanded(node.id)}
              selected={activeDocId === node.id}
              onClick={() => handleNodeSelect(node)}
              onCreateDoc={handleCreateDoc}
              onDelete={handleDelete}
            />
            {isExpanded &&
              children.length > 0 &&
              renderDocTree(children, level + 1)}
          </div>
        );
      });
    },
    [
      expandedNodes,
      handleToggleExpanded,
      activeDocId,
      handleNodeSelect,
      handleCreateDoc,
      handleDelete,
    ]
  );

  if (tree.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-sm text-muted-foreground px-4 text-center gap-3">
        <span>文档库为空</span>
        <Button size="sm" variant="outline" onClick={() => handleCreateDoc(null)}>
          <FilePlus className="h-4 w-4 mr-2" />
          新建文档
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto py-2">
      <div className="space-y-0.5">{renderDocTree(tree)}</div>
      <div className="p-2">
        <Button
          size="sm"
          variant="ghost"
          className="w-full justify-start"
          onClick={() => handleCreateDoc(null)}
        >
          <FilePlus className="h-4 w-4 mr-2" />
          新建根文档
        </Button>
      </div>
    </div>
  );
};

export const VibecapeSidebar = () => {
  const isSidebarCollapsed = useViewManager(
    (selector) => selector.isSidebarCollapsed
  );
  const workspace = useVibecapeStore((state) => state.workspace);

  return (
    <motion.div
      id="vibecape-sidebar"
      initial={false}
      animate={{
        width: isSidebarCollapsed ? "0px" : "360px",
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="h-full flex select-none overflow-hidden"
    >
      <div className="h-full w-[360px] flex flex-col bg-accent overflow-hidden pt-10">
        <SidebarHeader />
        {workspace?.initialized ? <DocTreeView /> : <SidebarEmptyState />}
      </div>
    </motion.div>
  );
};
