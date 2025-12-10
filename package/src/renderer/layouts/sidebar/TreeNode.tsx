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
import { nodeBaseStyles, INDENT_WIDTH } from "../../components/docs/constants";
import { useTranslation } from "react-i18next";

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
            <Button variant="ghost" size="icon">
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
                "flex-1 min-w-0 text-[13px] truncate",
                "text-foreground",
                "transition-colors duration-200",
                selected && "text-foreground",
                !node.title && "text-muted-foreground italic"
              )}
            >
              {node.title || t("common.settings.untitledDoc")}
            </div>

            {/* 右侧操作菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "opacity-0 group-hover:opacity-100",
                    "hover:bg-primary/10",
                    "transition-opacity duration-200 data-[state=open]:opacity-100"
                  )}
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
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(node)}
                >
                  <Trash2 className="h-4 w-4 mr-2 stroke-destructive" />
                  {t("common.settings.delete")}
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
