/**
 * Table Extension 打包
 *
 * 封装 Tiptap 官方表格扩展，提供：
 * - 表格创建与编辑
 * - 行/列增删
 * - 单元格合并
 * - 表头支持
 */

import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

// 自定义表格样式配置
const CustomTable = Table.configure({
  resizable: true,
  HTMLAttributes: {
    class: "custom-table",
  },
});

const CustomTableRow = TableRow.configure({
  HTMLAttributes: {
    class: "custom-table-row",
  },
});

const CustomTableCell = TableCell.configure({
  HTMLAttributes: {
    class: "custom-table-cell",
  },
});

const CustomTableHeader = TableHeader.configure({
  HTMLAttributes: {
    class: "custom-table-header",
  },
});

// 导出表格扩展组
export const TableExtension = [
  CustomTable,
  CustomTableRow,
  CustomTableCell,
  CustomTableHeader,
];

// 单独导出各组件（用于需要单独配置的场景）
export { CustomTable, CustomTableRow, CustomTableCell, CustomTableHeader };
