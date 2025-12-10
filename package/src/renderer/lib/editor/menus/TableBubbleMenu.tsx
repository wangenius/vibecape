import React, { useState, useEffect, useCallback, useRef } from "react";
import { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Merge,
  Split,
  GripVertical,
  GripHorizontal,
  Table as TableIcon,
  Eraser,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TableBubbleMenuProps {
  editor: Editor | null;
  containerRef?: React.RefObject<HTMLElement>;
}

// Handle Button Component - Must forward ref for Radix asChild
const HandleButton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, onMouseDown, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute z-50 flex items-center justify-center cursor-pointer",
      "bg-background border border-border shadow-sm text-muted-foreground",
      "hover:bg-accent hover:text-accent-foreground transition-all duration-200",
      "rounded-md",
      className
    )}
    onMouseDown={(e) => {
      // Important: Prevent editor blur when clicking the handle
      e.preventDefault();
      onMouseDown?.(e);
    }}
    {...props}
  >
    {children}
  </div>
));
HandleButton.displayName = "HandleButton";

export const TableBubbleMenu = ({ editor, containerRef }: TableBubbleMenuProps) => {
  const { t } = useTranslation();
  const [tableState, setTableState] = useState<{
    cell: { top: number; left: number; width: number; height: number };
    table: { top: number; left: number };
  } | null>(null);

  // Use a ref to track the last state to avoid unnecessary re-renders
  const lastState = useRef<{
    cell: { top: number; left: number; width: number; height: number };
    table: { top: number; left: number };
  } | null>(null);

  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const observedNodeRef = useRef<HTMLElement | null>(null);

  const updatePosition = useCallback(() => {
    if (!editor) return;

    // Check if table is active OR if we have a selection inside a table
    if (!editor.isActive("table")) {
      if (lastState.current) {
        lastState.current = null;
        setTableState(null);
      }
      // Disconnect observers if no table is active
      if (observedNodeRef.current) {
        resizeObserverRef.current?.disconnect();
        mutationObserverRef.current?.disconnect();
        observedNodeRef.current = null;
      }
      return;
    }

    const { from } = editor.state.selection;
    
    // 获取当前单元格
    let dom = editor.view.domAtPos(from).node as HTMLElement;
    if (dom.nodeType === 3) {
      dom = dom.parentElement as HTMLElement;
    }
    const cell = dom.closest("td, th") as HTMLElement;
    const table = dom.closest("table") as HTMLElement;
    
    if (cell && table && containerRef?.current) {
      // 1. Setup Observers if the cell has changed
      if (cell !== observedNodeRef.current) {
        // ResizeObserver
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
        } else {
          resizeObserverRef.current = new ResizeObserver(() => {
             requestAnimationFrame(updatePosition);
          });
        }
        resizeObserverRef.current.observe(cell);
        resizeObserverRef.current.observe(table);

        // MutationObserver (for style/attribute changes like col width)
        if (mutationObserverRef.current) {
          mutationObserverRef.current.disconnect();
        } else {
          mutationObserverRef.current = new MutationObserver(() => {
            requestAnimationFrame(updatePosition);
          });
        }
        mutationObserverRef.current.observe(table, {
          attributes: true,
          subtree: true,
          attributeFilter: ["style", "width", "class"],
        });

        observedNodeRef.current = cell;
      }

      // 2. Calculate positions
      const cellRect = cell.getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;

      // 相对于容器的坐标
      const cellTop = cellRect.top - containerRect.top + scrollTop;
      const cellLeft = cellRect.left - containerRect.left + scrollLeft;
      
      const tableTop = tableRect.top - containerRect.top + scrollTop;
      const tableLeft = tableRect.left - containerRect.left + scrollLeft;
      
      const newState = {
        cell: {
          top: cellTop,
          left: cellLeft,
          width: cellRect.width,
          height: cellRect.height,
        },
        table: {
          top: tableTop,
          left: tableLeft,
        }
      };

      // Simple diff check to prevent re-renders (and closing of dropdowns)
      if (
        !lastState.current ||
        Math.abs(lastState.current.cell.top - newState.cell.top) > 1 ||
        Math.abs(lastState.current.cell.left - newState.cell.left) > 1 ||
        Math.abs(lastState.current.cell.width - newState.cell.width) > 1 ||
        Math.abs(lastState.current.cell.height - newState.cell.height) > 1 ||
        Math.abs(lastState.current.table.top - newState.table.top) > 1 ||
        Math.abs(lastState.current.table.left - newState.table.left) > 1
      ) {
        lastState.current = newState;
        setTableState(newState);
      }
    }
  }, [editor, containerRef]);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      requestAnimationFrame(updatePosition);
    };

    editor.on("selectionUpdate", handleUpdate);
    editor.on("update", handleUpdate);
    editor.on("transaction", handleUpdate);

    window.addEventListener("resize", handleUpdate);
    const container = containerRef?.current;
    if (container) {
      container.addEventListener("scroll", handleUpdate);
    }
    
    return () => {
      editor.off("selectionUpdate", handleUpdate);
      editor.off("update", handleUpdate);
      editor.off("transaction", handleUpdate);
      window.removeEventListener("resize", handleUpdate);
      if (container) {
        container.removeEventListener("scroll", handleUpdate);
      }
      // Clean up observer
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [editor, updatePosition, containerRef]);

  if (!tableState || !editor) return null;

  const { cell, table } = tableState;

  return (
    <>
      {/* 1. Whole Table Handle (Top-Left Corner) */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <HandleButton
            className="size-6"
            style={{
              top: table.top - 10,
              left: table.left - 10,
            }}
            title={t("editor:table.tableActions")}
          >
            <TableIcon className="size-3.5" />
          </HandleButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>{t("editor:table.tableActions")}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} variant="destructive">
            <Trash2 className="mr-2 size-4" />
            {t("editor:table.deleteTable")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 2. Column Handle (Top centered on cell) */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <HandleButton
            className="w-8 h-5"
            style={{
              top: cell.top - 10,
              left: cell.left + (cell.width / 2) - 16, // Center horizontally
            }}
            title={t("editor:table.columnActions")}
          >
            <GripHorizontal className="size-3.5" />
          </HandleButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuLabel>{t("editor:table.columnActions")}</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
              <ArrowLeft className="mr-2 size-4" />
              {t("editor:table.addColBefore")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
              <ArrowRight className="mr-2 size-4" />
              {t("editor:table.addColAfter")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()} variant="destructive">
              <Trash2 className="mr-2 size-4" />
              {t("editor:table.deleteCol")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 3. Row Handle (Left centered on cell) */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <HandleButton
            className="w-5 h-8"
            style={{
              top: cell.top + (cell.height / 2) - 16, // Center vertically
              left: cell.left - 10,
            }}
            title={t("editor:table.rowActions")}
          >
            <GripVertical className="size-3.5" />
          </HandleButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="left">
          <DropdownMenuLabel>{t("editor:table.rowActions")}</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
              <ArrowUp className="mr-2 size-4" />
              {t("editor:table.addRowBefore")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
              <ArrowDown className="mr-2 size-4" />
              {t("editor:table.addRowAfter")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()} variant="destructive">
              <Trash2 className="mr-2 size-4" />
              {t("editor:table.deleteRow")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
             <DropdownMenuItem onClick={() => editor.chain().focus().mergeCells().run()}>
              <Merge className="mr-2 size-4" />
              {t("editor:table.mergeCells")}
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => editor.chain().focus().splitCell().run()}>
              <Split className="mr-2 size-4" />
              {t("editor:table.splitCell")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => {
              editor.chain().focus().deleteSelection().run();
            }}>
             <Eraser className="mr-2 size-4" />
             {t("editor:table.clearCell")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
