import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDocsStore } from "../useDocsStore";
import type { DocNavNode } from "@common/types/docs";
import { ChevronRight, FolderOpen, Folder, Loader2, RefreshCcw, Trash2, FilePlus, FolderPlus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useViewManager, setViewManager } from "@/hook/app/useViewManager";
import { TbScript, TbSettings, TbBox, TbInfoCircle, TbDots } from "react-icons/tb";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  useDndContext,
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// 拖拽悬停延迟（用于区分排序和移动到文件夹）
const DRAG_HOVER_DELAY = 800;

const INDENT_WIDTH = 24;

// 节点样式 - 与 StoryTreeView 完全一致
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
  dragOver: [],
};

// 树节点组件 - 与 StoryTreeView 完全一致
interface TreeNodeProps {
  node: DocNavNode;
  level: number;
  children: DocNavNode[];
  isExpanded: boolean;
  onToggle: () => void;
  selected: boolean;
  onClick: () => void;
  onCreateDoc: (parentPath: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onDelete: (node: DocNavNode) => void;
  isDraggingOver: string | null;
}

const TreeNode = memo(({
  node,
  level,
  children,
  isExpanded,
  onToggle,
  selected,
  onClick,
  onCreateDoc,
  onCreateFolder,
  onDelete,
  isDraggingOver,
}: TreeNodeProps) => {
  const hasChildren = children.length > 0;

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: node.id,
    data: {
      id: node.id,
      title: node.title,
      type: node.type,
    },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: node.id,
    data: {
      id: node.id,
      title: node.title,
      type: node.type,
    },
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
    isDragging && nodeBaseStyles.dragging,
    isOver && !isDragging && nodeBaseStyles.dragOver
  );

  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  }, [onToggle]);

  // 获取当前节点的父目录路径
  const getParentPath = () => {
    if (node.type === "group") {
      return node.id;
    }
    const parts = node.id.split("/");
    parts.pop();
    return parts.join("/") || "";
  };

  const renderContent = () => (
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
          ) : node.type === "group" ? (
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
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onCreateDoc(getParentPath())}>
              <FilePlus className="h-4 w-4 mr-2" />
              新建文档
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateFolder(getParentPath())}>
              <FolderPlus className="h-4 w-4 mr-2" />
              新建文件夹
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

      {/* Drop 指示器 - 与 StoryTreeView 一致 */}
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
      {renderContent()}
    </div>
  );
});

TreeNode.displayName = "TreeNode";

// 侧边栏头部
const SidebarHeader = () => {
  const root = useDocsStore((state) => state.root);
  const loading = useDocsStore((state) => state.loading);
  const chooseRoot = useDocsStore((state) => state.chooseRoot);
  const refreshStories = useDocsStore((state) => state.refreshStories);

  return (
    <div className="p-3 border-b border-border/30 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">文档目录</div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => void refreshStories()}
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
            className="h-5 w-5"
            onClick={() => void chooseRoot()}
            disabled={loading}
            title="选择目录"
          >
            <FolderOpen className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="text-sm font-medium truncate text-foreground/80">
        {root ? root.split("/").pop() : "未选择"}
      </div>
    </div>
  );
};

// 文档树视图 - 与 StoryTreeView 完全一致
const DocTreeView = () => {
  const activeStory = useDocsStore((state) => state.activeStory);
  const activePath = useDocsStore((state) => state.activePath);
  const openDoc = useDocsStore((state) => state.openDoc);
  const refreshStories = useDocsStore((state) => state.refreshStories);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const { active, over } = useDndContext();
  const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);

  const tree = useMemo(() => activeStory?.tree ?? [], [activeStory?.tree]);

  // 悬停延迟逻辑 - 与 StoryTreeView 一致
  useEffect(() => {
    if (!over || !active) {
      setIsDraggingOver(null);
      return;
    }

    const timer = setTimeout(() => {
      setIsDraggingOver(over.id as string);
    }, DRAG_HOVER_DELAY);

    return () => clearTimeout(timer);
  }, [over, active]);

  // 获取子节点
  const getChildren = useCallback((node: DocNavNode): DocNavNode[] => {
    return node.children ?? [];
  }, []);

  // 切换展开/折叠
  const handleToggleExpanded = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  }, []);

  // 选择节点
  const handleNodeSelect = useCallback((node: DocNavNode) => {
    if (node.path) {
      void openDoc(node.path);
    }
    if (node.type === "group") {
      handleToggleExpanded(node.id);
    }
  }, [openDoc, handleToggleExpanded]);

  // 新建文档
  const handleCreateDoc = useCallback((parentPath: string) => {
    let fileName = "";
    dialog({
      title: "新建文档",
      content: () => (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">文件名</label>
            <Input
              placeholder="例如: getting-started"
              onChange={(e) => (fileName = e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              将创建 {parentPath ? `${parentPath}/` : ""}{fileName || "文件名"}.mdx
            </p>
          </div>
        </div>
      ),
      footer: (close) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>取消</Button>
          <Button onClick={async () => {
            if (!fileName.trim()) {
              toast.error("请输入文件名");
              return;
            }
            try {
              const filePath = parentPath 
                ? `${parentPath}/${fileName.trim()}.mdx`
                : `${fileName.trim()}.mdx`;
              await window.api.docs.writeDoc(
                activeStory?.id ?? "__root__",
                filePath,
                "",
                { title: fileName.trim() }
              );
              toast.success("文档已创建");
              close();
              void refreshStories();
            } catch (error: any) {
              toast.error(error?.message ?? "创建失败");
            }
          }}>
            创建
          </Button>
        </div>
      ),
      className: "max-w-md",
    });
  }, [activeStory?.id, refreshStories]);

  // 新建文件夹
  const handleCreateFolder = useCallback((parentPath: string) => {
    let folderName = "";
    dialog({
      title: "新建文件夹",
      content: () => (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">文件夹名</label>
            <Input
              placeholder="例如: guides"
              onChange={(e) => (folderName = e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              将创建 {parentPath ? `${parentPath}/` : ""}{folderName || "文件夹"}/index.mdx
            </p>
          </div>
        </div>
      ),
      footer: (close) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>取消</Button>
          <Button onClick={async () => {
            if (!folderName.trim()) {
              toast.error("请输入文件夹名");
              return;
            }
            try {
              const indexPath = parentPath
                ? `${parentPath}/${folderName.trim()}/index.mdx`
                : `${folderName.trim()}/index.mdx`;
              await window.api.docs.writeDoc(
                activeStory?.id ?? "__root__",
                indexPath,
                "",
                { title: folderName.trim() }
              );
              toast.success("文件夹已创建");
              close();
              void refreshStories();
            } catch (error: any) {
              toast.error(error?.message ?? "创建失败");
            }
          }}>
            创建
          </Button>
        </div>
      ),
      className: "max-w-md",
    });
  }, [activeStory?.id, refreshStories]);

  // 删除文档/文件夹
  const handleDelete = useCallback((node: DocNavNode) => {
    dialog.confirm({
      title: "确认删除",
      content: (
        <p>
          确定要删除 <strong>{node.title}</strong> 吗？
          {node.type === "group" && "该文件夹下的所有内容也会被删除。"}
        </p>
      ),
      okText: "删除",
      cancelText: "取消",
      variants: "destructive",
      onOk: async () => {
        try {
          await window.api.docs.deleteDoc(activeStory?.id ?? "__root__", node.id);
          toast.success("已删除");
          void refreshStories();
        } catch (error: any) {
          toast.error(error?.message ?? "删除失败");
        }
      },
    });
  }, [activeStory?.id, refreshStories]);

  // 递归渲染树
  const renderDocTree = useCallback(
    (nodes: DocNavNode[], level = 0) => {
      return nodes.map((node) => {
        const children = getChildren(node);
        const isExpanded = expandedNodes[node.id] ?? false;

        return (
          <div key={node.id} className="space-y-0.5 overflow-x-hidden">
            <TreeNode
              node={node}
              level={level}
              children={children}
              isExpanded={isExpanded}
              onToggle={() => handleToggleExpanded(node.id)}
              selected={activePath === node.path}
              onClick={() => handleNodeSelect(node)}
              onCreateDoc={handleCreateDoc}
              onCreateFolder={handleCreateFolder}
              onDelete={handleDelete}
              isDraggingOver={isDraggingOver}
            />
            {isExpanded && children.length > 0 && renderDocTree(children, level + 1)}
          </div>
        );
      });
    },
    [getChildren, expandedNodes, handleToggleExpanded, activePath, handleNodeSelect, handleCreateDoc, handleCreateFolder, handleDelete, isDraggingOver]
  );

  if (tree.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-sm text-muted-foreground px-4 text-center gap-3">
        <span>目录为空</span>
        <Button size="sm" variant="outline" onClick={() => handleCreateDoc("")}>
          <FilePlus className="h-4 w-4 mr-2" />
          新建文档
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto py-2">
      <div className="space-y-0.5">{renderDocTree(tree)}</div>
    </div>
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
  const currentSection = useViewManager((state) => state.previewCosmosId) || "general";

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

// DndContext 包装器
const DocTreeWithDnd = () => {
  const activeStory = useDocsStore((state) => state.activeStory);
  const refreshStories = useDocsStore((state) => state.refreshStories);
  const [draggingNode, setDraggingNode] = useState<DocNavNode | null>(null);
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
  const hoverTimerRef = useCallback(() => ({ current: null as NodeJS.Timeout | null }), [])();

  // 配置拖拽传感器 - 需要移动 8px 才开始拖拽，避免点击被误判为拖拽
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: any) => {
    const node = event.active.data.current as DocNavNode;
    setDraggingNode(node);
    setHoveredFolderId(null);
  }, []);

  const handleDragOver = useCallback((event: any) => {
    const { over } = event;
    
    // 清除之前的定时器
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    if (!over) {
      setHoveredFolderId(null);
      return;
    }

    const overData = over.data.current as { type?: string } | undefined;
    
    // 只有悬停在文件夹上时才设置定时器
    if (overData?.type === "group") {
      hoverTimerRef.current = setTimeout(() => {
        setHoveredFolderId(over.id as string);
      }, DRAG_HOVER_DELAY);
    } else {
      setHoveredFolderId(null);
    }
  }, [hoverTimerRef]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    // 清除定时器
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    const savedHoveredId = hoveredFolderId;
    setDraggingNode(null);
    setHoveredFolderId(null);

    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const overData = over.data.current as { type?: string } | undefined;
    // 长时间悬停在文件夹上 → 移动到文件夹
    const isMovingToFolder = overData?.type === "group" && savedHoveredId === over.id;

    try {
      if (isMovingToFolder) {
        // 移动到文件夹
        await window.api.docs.moveDoc(
          activeStory?.id ?? "__root__",
          active.id as string,
          over.id as string
        );
        toast.success("已移动到文件夹");
      } else {
        // 同级排序
        await window.api.docs.reorderDoc(
          activeStory?.id ?? "__root__",
          active.id as string,
          over.id as string
        );
        toast.success("顺序已更新");
      }
      void refreshStories();
    } catch (error: any) {
      toast.error(error?.message ?? "操作失败");
    }
  }, [activeStory?.id, refreshStories, hoveredFolderId, hoverTimerRef]);

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

export const DocsSidebar = () => {
  const isSidebarCollapsed = useViewManager(
    (selector) => selector.isSidebarCollapsed
  );
  const activeSidebarPanel = useViewManager(
    (selector) => selector.activeSidebarPanel
  );
  const root = useDocsStore((state) => state.root);

  const isSettingsMode = activeSidebarPanel === "settings";

  return (
    <motion.div
      id="docs-sidebar"
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
          <SidebarHeader />
          {root && <DocTreeWithDnd />}
          {!root && (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground px-4 text-center">
              选择文档目录以开始
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
