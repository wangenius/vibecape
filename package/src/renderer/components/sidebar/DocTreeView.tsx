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
import { useTranslation } from "react-i18next";

// 文档树视图
export const DocTreeView = () => {
  const { t } = useTranslation();
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
        title: t("common.settings.newDoc"),
        className: "max-w-sm",
        content: (
          <Input
            placeholder={t("common.settings.docNamePlaceholder")}
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
              {t("common.actions.cancel")}
            </Button>
            <Button
              size="sm"
              data-create-child-btn
              onClick={async () => {
                if (!title.trim()) {
                  toast.error(t("common.settings.enterDocName"));
                  return;
                }
                try {
                  await createDoc({
                    parent_id: parentId,
                    title: title.trim(),
                  });
                  toast.success(t("common.settings.docCreated"));
                  close();
                } catch (error: any) {
                  toast.error(
                    error?.message ?? t("common.settings.createFailed")
                  );
                }
              }}
            >
              {t("common.settings.create")}
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
        title: t("common.settings.confirmDelete"),
        content: (
          <p>
            {t("common.settings.deleteDocConfirm", { title: node.title })}
            {hasChildren && t("common.settings.deleteDocChildrenWarning")}
          </p>
        ),
        okText: t("common.settings.delete"),
        cancelText: t("common.actions.cancel"),
        variants: "destructive",
        onOk: async () => {
          try {
            await deleteDoc(node.id);
            toast.success(t("common.settings.deleted"));
          } catch (error: any) {
            toast.error(error?.message ?? t("common.settings.deleteFailed"));
          }
        },
      });
    },
    [deleteDoc]
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
          size="sm"
          variant="outline"
          onClick={() => handleCreateDoc(null)}
        >
          <FilePlus className="h-4 w-4 mr-2" />
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
          toast.success(t("common.settings.movedToFolder"));
        } else {
          await window.api.vibecape.reorderDoc(
            active.id as string,
            over.id as string
          );
          toast.success(t("common.settings.reordered"));
        }
        void refreshTree();
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
          <div className="bg-background border rounded-lg px-3 py-1.5 text-sm shadow-lg">
            {draggingNode.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
