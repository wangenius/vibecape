import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVibecapeStore } from "../useVibecapeStore";
import type { DocTreeNode } from "@common/schema/docs";
import {
  ChevronRight,
  Folder,
  Loader2,
  Trash2,
  FilePlus,
  X,
  Download,
  Upload,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useViewManager } from "@/hook/app/useViewManager";
import {
  TbScript,
  TbDots,
  TbSettings,
  TbBox,
  TbInfoCircle,
} from "react-icons/tb";
import { setViewManager } from "@/hook/app/useViewManager";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dialog } from "@/components/custom/DialogModal";
import { toast } from "sonner";

const DRAG_HOVER_DELAY = 800;
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
  dragging: ["opacity-50"],
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
  isDraggingOver: string | null;
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
    isDraggingOver,
  }: TreeNodeProps) => {
    const hasChildren = (node.children?.length ?? 0) > 0;

    const {
      attributes,
      listeners,
      setNodeRef: setDragRef,
      isDragging,
    } = useDraggable({
      id: node.id,
      data: { id: node.id, title: node.title, hasChildren },
    });

    const { setNodeRef: setDropRef, isOver } = useDroppable({
      id: node.id,
      data: { id: node.id, title: node.title, hasChildren },
    });

    const setNodeRef = useCallback(
      (el: HTMLElement | null) => {
        setDragRef(el);
        setDropRef(el);
      },
      [setDragRef, setDropRef]
    );

    const nodeStyles = cn(
      nodeBaseStyles.base,
      selected && nodeBaseStyles.selected,
      isDragging && nodeBaseStyles.dragging
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

        <div className="relative">
          <div
            ref={setNodeRef}
            className={nodeStyles}
            onClick={handleClick}
            {...listeners}
            {...attributes}
          >
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

          {/* Drop 指示器 */}
          {isOver && !isDragging && (
            <>
              {isDraggingOver === node.id ? (
                <div className="absolute inset-0 border-2 border-primary/30 rounded-lg bg-primary/5 animate-in fade-in-0 zoom-in-95" />
              ) : (
                <div className="absolute -top-0.5 inset-x-0 h-[3px] bg-primary/50" />
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);

TreeNode.displayName = "TreeNode";

// 侧边栏头部
const SidebarHeader = ({
  onCreateDoc,
}: {
  onCreateDoc: (parentId: string | null) => void;
}) => {
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

// 侧边栏空状态
const SidebarEmptyState = () => (
  <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
    <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
      <Folder className="w-6 h-6 text-muted-foreground" />
    </div>
    <p className="text-sm text-muted-foreground">打开 docs 目录开始使用</p>
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
      let title = "";
      dialog({
        title: "新建文档",
        className: "max-w-sm",
        content: (
          <Input
            placeholder="输入文档名称"
            onChange={(e) => (title = e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim()) {
                e.preventDefault();
                const btn = document.querySelector(
                  "[data-create-child-btn]"
                ) as HTMLButtonElement;
                btn?.click();
              }
            }}
          />
        ),
        footer: (close) => (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={close}>
              取消
            </Button>
            <Button
              size="sm"
              data-create-child-btn
              onClick={async () => {
                if (!title.trim()) {
                  toast.error("请输入文档名称");
                  return;
                }
                try {
                  await createDoc({
                    parent_id: parentId,
                    title: title.trim(),
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
    (nodes: DocTreeNode[], level = 0, isDraggingOver: string | null) => {
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
              isDraggingOver={isDraggingOver}
            />
            {isExpanded &&
              children.length > 0 &&
              renderDocTree(children, level + 1, isDraggingOver)}
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
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleCreateDoc(null)}
        >
          <FilePlus className="h-4 w-4 mr-2" />
          新建文档
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto py-2">
      <div className="space-y-0.5">{renderDocTree(tree, 0, null)}</div>
    </div>
  );
};

// 新建文档对话框
const useCreateDocDialog = () => {
  const createDoc = useVibecapeStore((state) => state.createDoc);

  return useCallback(
    (parentId: string | null) => {
      let title = "";
      dialog({
        title: "新建文档",
        className: "max-w-sm",
        content: (
          <Input
            placeholder="输入文档名称"
            onChange={(e) => (title = e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim()) {
                e.preventDefault();
                const btn = document.querySelector(
                  "[data-create-doc-btn]"
                ) as HTMLButtonElement;
                btn?.click();
              }
            }}
          />
        ),
        footer: (close) => (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={close}>
              取消
            </Button>
            <Button
              size="sm"
              data-create-doc-btn
              onClick={async () => {
                if (!title.trim()) {
                  toast.error("请输入文档名称");
                  return;
                }
                try {
                  await createDoc({
                    parent_id: parentId,
                    title: title.trim(),
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
      });
    },
    [createDoc]
  );
};

// DndContext 包装器
const DocTreeWithDnd = () => {
  const refreshTree = useVibecapeStore((state) => state.refreshTree);
  const [draggingNode, setDraggingNode] = useState<DocTreeNode | null>(null);
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
  const hoverTimerRef = useCallback(
    () => ({ current: null as NodeJS.Timeout | null }),
    []
  )();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = useCallback((event: any) => {
    setDraggingNode(event.active.data.current);
    setHoveredFolderId(null);
  }, []);

  const handleDragOver = useCallback(
    (event: any) => {
      const { over } = event;

      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }

      if (!over) {
        setHoveredFolderId(null);
        return;
      }

      const overData = over.data.current as
        | { hasChildren?: boolean }
        | undefined;
      if (overData?.hasChildren) {
        hoverTimerRef.current = setTimeout(() => {
          setHoveredFolderId(over.id as string);
        }, DRAG_HOVER_DELAY);
      } else {
        setHoveredFolderId(null);
      }
    },
    [hoverTimerRef]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }

      const savedHoveredId = hoveredFolderId;
      setDraggingNode(null);
      setHoveredFolderId(null);

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const overData = over.data.current as
        | { hasChildren?: boolean }
        | undefined;
      const isMovingToFolder =
        overData?.hasChildren && savedHoveredId === over.id;

      try {
        if (isMovingToFolder) {
          await window.api.vibecape.moveDoc(
            active.id as string,
            over.id as string
          );
          toast.success("已移动到文件夹");
        } else {
          await window.api.vibecape.reorderDoc(
            active.id as string,
            over.id as string
          );
          toast.success("顺序已更新");
        }
        void refreshTree();
      } catch (error: any) {
        toast.error(error?.message ?? "操作失败");
      }
    },
    [refreshTree, hoveredFolderId, hoverTimerRef]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <DocTreeView />
      <DragOverlay>
        {draggingNode ? (
          <div className="bg-background border rounded-lg px-3 py-1.5 text-sm shadow-lg">
            {draggingNode.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

// 设置导航项
const SETTINGS_NAV_ITEMS = [
  { key: "general", label: "通用", icon: TbSettings },
  { key: "models", label: "模型", icon: TbBox },
  { key: "about", label: "关于", icon: TbInfoCircle },
];

// 设置侧边栏
const SettingsSidebar = () => {
  const currentSection =
    useViewManager((state) => state.previewCosmosId) || "general";

  return (
    <div className="h-full w-[360px] flex flex-col bg-accent overflow-hidden pt-10">
      <div className="p-3 border-b border-border/30">
        <div className="text-sm font-medium">设置</div>
      </div>
      <div className="flex-1 p-2 space-y-1">
        {SETTINGS_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setViewManager({ previewCosmosId: item.key });
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const VibecapeSidebar = () => {
  const isSidebarCollapsed = useViewManager(
    (selector) => selector.isSidebarCollapsed
  );
  const activeSidebarPanel = useViewManager(
    (selector) => selector.activeSidebarPanel
  );
  const workspace = useVibecapeStore((state) => state.workspace);
  const handleCreateDoc = useCreateDocDialog();
  const isSettingsMode = activeSidebarPanel === "settings";

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
      {isSettingsMode ? (
        <SettingsSidebar />
      ) : (
        <div className="h-full w-[360px] flex flex-col bg-accent overflow-hidden pt-10">
          <SidebarHeader onCreateDoc={handleCreateDoc} />
          {workspace?.initialized ? <DocTreeWithDnd /> : <SidebarEmptyState />}
        </div>
      )}
    </motion.div>
  );
};
