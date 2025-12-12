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
  Table as TableIcon,
  Eraser,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TableBubbleMenuProps {
  editor: Editor | null;
  containerRef?: React.RefObject<HTMLElement>;
}

// 操作触发器 - 简洁的短线
const HandleLine = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical";
  }
>(({ className, orientation = "horizontal", onMouseDown, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute z-50 cursor-pointer",
      // 短线样式 - 柔和的灰色系
      "rounded-full",
      "bg-muted-foreground/30",
      "hover:bg-muted-foreground/70",
      "transition-colors duration-150",
      // 根据方向设置尺寸
      orientation === "horizontal" ? "h-1 w-4" : "w-1 h-4",
      className
    )}
    onMouseDown={(e) => {
      e.preventDefault();
      onMouseDown?.(e);
    }}
    {...props}
  />
));
HandleLine.displayName = "HandleLine";

// 表格全局操作按钮
const TableButton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, onMouseDown, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute z-50 flex items-center justify-center cursor-pointer",
      "size-5 rounded",
      "bg-muted/60 text-muted-foreground/60",
      "hover:bg-primary/10 hover:text-primary",
      "transition-all duration-150",
      className
    )}
    onMouseDown={(e) => {
      e.preventDefault();
      onMouseDown?.(e);
    }}
    {...props}
  >
    {children}
  </div>
));
TableButton.displayName = "TableButton";

export const TableBubbleMenu = ({
  editor,
  containerRef,
}: TableBubbleMenuProps) => {
  const { t } = useTranslation();
  const [tableState, setTableState] = useState<{
    cell: { top: number; left: number; width: number; height: number };
    table: { top: number; left: number; width: number; height: number };
    selection: { top: number; left: number; width: number; height: number };
  } | null>(null);

  // Use a ref to track the last state to avoid unnecessary re-renders
  const lastState = useRef<{
    cell: { top: number; left: number; width: number; height: number };
    table: { top: number; left: number; width: number; height: number };
    selection: { top: number; left: number; width: number; height: number };
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
      // 获取所有选中的单元格来计算选中区域
      const selectedCells = table.querySelectorAll(".selectedCell");
      let selectionRect: DOMRect;

      if (selectedCells.length > 1) {
        // 多个单元格选中：计算边界框
        let minTop = Infinity,
          minLeft = Infinity;
        let maxBottom = -Infinity,
          maxRight = -Infinity;

        selectedCells.forEach((selectedCell) => {
          const rect = selectedCell.getBoundingClientRect();
          minTop = Math.min(minTop, rect.top);
          minLeft = Math.min(minLeft, rect.left);
          maxBottom = Math.max(maxBottom, rect.bottom);
          maxRight = Math.max(maxRight, rect.right);
        });

        selectionRect = new DOMRect(
          minLeft,
          minTop,
          maxRight - minLeft,
          maxBottom - minTop
        );
      } else {
        // 单个单元格或无选中：使用当前单元格
        selectionRect = cell.getBoundingClientRect();
      }

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

      const selectionTop = selectionRect.top - containerRect.top + scrollTop;
      const selectionLeft =
        selectionRect.left - containerRect.left + scrollLeft;

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
          width: tableRect.width,
          height: tableRect.height,
        },
        selection: {
          top: selectionTop,
          left: selectionLeft,
          width: selectionRect.width,
          height: selectionRect.height,
        },
      };

      // Simple diff check to prevent re-renders (and closing of dropdowns)
      if (
        !lastState.current ||
        Math.abs(lastState.current.cell.top - newState.cell.top) > 1 ||
        Math.abs(lastState.current.cell.left - newState.cell.left) > 1 ||
        Math.abs(lastState.current.cell.width - newState.cell.width) > 1 ||
        Math.abs(lastState.current.cell.height - newState.cell.height) > 1 ||
        Math.abs(lastState.current.table.top - newState.table.top) > 1 ||
        Math.abs(lastState.current.table.left - newState.table.left) > 1 ||
        Math.abs(lastState.current.selection.top - newState.selection.top) >
          1 ||
        Math.abs(lastState.current.selection.left - newState.selection.left) >
          1 ||
        Math.abs(lastState.current.selection.width - newState.selection.width) >
          1 ||
        Math.abs(
          lastState.current.selection.height - newState.selection.height
        ) > 1
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

  const { cell, table, selection } = tableState;

  return (
    <>
      {/* 选中区域边框覆盖层 - 柔和的灰色边框 */}
      <div
        className="absolute z-40 pointer-events-none border border-muted-foreground/40 rounded-sm"
        style={{
          top: selection.top,
          left: selection.left,
          width: selection.width,
          height: selection.height,
        }}
      />

      {/* 1. 列操作 - 表格顶部，对应当前列 */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <HandleLine
            orientation="horizontal"
            style={{
              top: table.top - 7, // 表格顶部上方
              left: cell.left + cell.width / 2 - 8, // 当前列中心
            }}
            title={t("table.columnActions")}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuLabel>{t("table.columnActions")}</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnBefore().run()}
            >
              <ArrowLeft className="mr-2 size-4" />
              {t("table.addColBefore")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            >
              <ArrowRight className="mr-2 size-4" />
              {t("table.addColAfter")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              {t("table.deleteCol")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 2. 行操作 - 表格左侧，对应当前行 */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <HandleLine
            orientation="vertical"
            style={{
              top: cell.top + cell.height / 2 - 8, // 当前行中心
              left: table.left - 7, // 表格左侧
            }}
            title={t("table.rowActions")}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="left">
          <DropdownMenuLabel>{t("table.rowActions")}</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowBefore().run()}
            >
              <ArrowUp className="mr-2 size-4" />
              {t("table.addRowBefore")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowAfter().run()}
            >
              <ArrowDown className="mr-2 size-4" />
              {t("table.addRowAfter")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              {t("table.deleteRow")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 3. 单元格操作 - 选中区域右侧 */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <HandleLine
            orientation="vertical"
            style={{
              top: selection.top + selection.height / 2 - 8,
              left: selection.left + selection.width + 4, // 选中区域右侧外
            }}
            title={t("table.cellActions")}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right">
          <DropdownMenuLabel>{t("table.cellActions")}</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().mergeCells().run()}
            >
              <Merge className="mr-2 size-4" />
              {t("table.mergeCells")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().splitCell().run()}
            >
              <Split className="mr-2 size-4" />
              {t("table.splitCell")}
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              editor.chain().focus().deleteSelection().run();
            }}
          >
            <Eraser className="mr-2 size-4" />
            {t("table.clearCell")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 4. 表格操作 - 表格左上角 */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <TableButton
            style={{
              top: table.top - 10,
              left: table.left - 20,
            }}
            title={t("table.tableActions")}
          >
            <TableIcon className="size-3" />
          </TableButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>{t("table.tableActions")}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            {t("table.deleteTable")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
