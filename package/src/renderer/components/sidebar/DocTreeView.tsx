import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVibecapeStore } from "@/hook/useVibecapeStore";
import type { DocTreeNode } from "@common/schema/docs";
import { FilePlus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { dialog } from "@/components/custom/DialogModal";
import { toast } from "sonner";
import { TreeNode } from "./TreeNode";
import { DRAG_HOVER_DELAY } from "./constants";

// 文档树视图
export const DocTreeView = () => {
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

// DndContext 包装器
export const DocTreeWithDnd = () => {
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
