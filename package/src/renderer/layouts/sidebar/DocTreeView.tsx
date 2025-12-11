import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/hooks/stores";
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
import { toast } from "sonner";
import { TreeNode } from "./TreeNode";
import { useTranslation } from "react-i18next";
export const DRAG_HOVER_DELAY = 800;
// 文档树视图
export const DocTreeView = () => {
  const { t } = useTranslation();
  const tree = useDocumentStore((state) => state.tree);
  const activeDocId = useDocumentStore((state) => state.activeDocId);
  const openDoc = useDocumentStore((state) => state.openDoc);
  const createDoc = useDocumentStore((state) => state.createDoc);
  const deleteDoc = useDocumentStore((state) => state.deleteDoc);
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
    async (parentId: string | null) => {
      try {
        const doc = await createDoc({
          parent_id: parentId,
          title: "",
        });
        await openDoc(doc.id);
      } catch (error: any) {
        toast.error(error?.message ?? t("common.settings.createFailed"));
      }
    },
    [createDoc, openDoc, t]
  );

  // 删除文档
  const handleDelete = useCallback(
    async (node: DocTreeNode) => {
      try {
        await deleteDoc(node.id);
        toast.success(t("common.settings.deleted"));
      } catch (error: any) {
        toast.error(error?.message ?? t("common.settings.deleteFailed"));
      }
    },
    [deleteDoc, t]
  );

  // 导出为 Markdown
  const handleExportMarkdown = useCallback(async (node: DocTreeNode) => {
    try {
      await window.api.vibecape.exportDocAsMarkdown(node.id);
      toast.success(t("common.settings.exportMarkdownSuccess"));
    } catch (error: any) {
      toast.error(error?.message ?? t("common.settings.exportFailed"));
    }
  }, []);

  // 导出为 PDF
  const handleExportPdf = useCallback(async (node: DocTreeNode) => {
    try {
      await window.api.vibecape.exportDocAsPdf(node.id);
      toast.success(t("common.settings.exportPdfSuccess"));
    } catch (error: any) {
      toast.error(error?.message ?? t("common.settings.exportFailed"));
    }
  }, []);

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
              onExportMarkdown={handleExportMarkdown}
              onExportPdf={handleExportPdf}
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
      handleExportMarkdown,
      handleExportPdf,
    ]
  );

  if (tree.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-sm text-muted-foreground px-4 text-center gap-3">
        <span>{t("common.settings.emptyDocs")}</span>
        <Button
          
          
          onClick={() => handleCreateDoc(null)}
        >
          <FilePlus />
          {t("common.settings.newDoc")}
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
  const { t } = useTranslation();
  const refreshTree = useDocumentStore((state) => state.refreshTree);
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
        } else {
          await window.api.vibecape.reorderDoc(
            active.id as string,
            over.id as string
          );
        }
        await refreshTree(true);
      } catch (error: any) {
        toast.error(error?.message ?? t("common.settings.operationFailed"));
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
          <div className="drag-overlay">{draggingNode.title}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
