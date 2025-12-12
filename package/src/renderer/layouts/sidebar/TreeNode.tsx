import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { DocTreeNode } from "@common/schema/docs";
import { FilePlus, Trash2, FileDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { TbScript, TbDots, TbChevronRight } from "react-icons/tb";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { useTranslation } from "react-i18next";
export const INDENT_WIDTH = 24;

const nodeBaseStyles = {
  base: cn(
    "group relative flex items-center gap-1 p-0.5 rounded-lg",
    "transition-all duration-200 ease-out",
    "cursor-pointer",
    "border border-transparent",
    "hover:bg-muted-foreground/5"
  ),
  selected: ["bg-primary/5 hover:bg-primary/8"],
  dragging: ["opacity-50"],
};

export interface TreeNodeProps {
  node: DocTreeNode;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  selected: boolean;
  onClick: () => void;
  onCreateDoc: (parentId: string | null) => void;
  onDelete: (node: DocTreeNode) => void;
  onExportMarkdown: (node: DocTreeNode) => void;
  onExportPdf: (node: DocTreeNode) => void;
  isDraggingOver: string | null;
}

export const TreeNode = memo(
  ({
    node,
    level,
    isExpanded,
    onToggle,
    selected,
    onClick,
    onCreateDoc,
    onDelete,
    onExportMarkdown,
    onExportPdf,
    isDraggingOver,
  }: TreeNodeProps) => {
    const { t } = useTranslation();
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
        <div className="relative group">
          <div
            ref={setNodeRef}
            className={nodeStyles}
            onClick={handleClick}
            {...listeners}
            {...attributes}
          >
            {/* 展开/折叠图标 */}
            <Button size="icon">
              {hasChildren ? (
                <TbChevronRight
                  className={cn(isExpanded && "transform rotate-90")}
                  onClick={handleToggle}
                />
              ) : (
                <TbScript />
              )}
            </Button>

            {/* 节点标题 */}
            <div
              className={cn(
                "flex-1 min-w-0 text-xs truncate text-foreground",
                !node.title && "italic"
              )}
            >
              {node.title || t("common.settings.untitledDoc")}
            </div>

            {/* 右侧操作菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  className="opacity-0 hover:bg-primary/10 data-[state=open]:opacity-100 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <TbDots />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem onClick={() => onCreateDoc(node.id)}>
                  <FilePlus />
                  {t("common.settings.newSubDoc")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExportMarkdown(node)}>
                  <FileText />
                  {t("common.settings.exportMarkdown")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExportPdf(node)}>
                  <FileDown />
                  {t("common.settings.exportPdf")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(node)}>
                  <Trash2 />
                  {t("common.settings.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Drop 指示器 - 移动为子节点 */}
          <div
            className={cn(
              "absolute inset-0 rounded-lg border-2 border-dashed pointer-events-none transition-all duration-200",
              isOver && !isDragging && isDraggingOver === node.id
                ? "border-primary/50 bg-primary/10 opacity-100"
                : "border-transparent bg-transparent opacity-0"
            )}
          />
          {/* Drop 指示器 - 排序线 */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 h-0.5 rounded-full pointer-events-none transition-all duration-150",
              isOver && !isDragging && isDraggingOver !== node.id
                ? "bg-primary opacity-100 scale-x-100"
                : "bg-transparent opacity-0 scale-x-0"
            )}
          />
        </div>
      </div>
    );
  }
);

TreeNode.displayName = "TreeNode";
