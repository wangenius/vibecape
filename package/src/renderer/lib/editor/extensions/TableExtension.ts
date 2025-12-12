/**
 * Table Extension - Notion-like 表格
 *
 * 提供类似 Notion 的表格体验：
 * - 简洁优雅的视觉设计
 * - 流畅的交互体验
 * - 列宽度调整
 * - 行/列操作
 * - 富文本单元格
 * - 表头支持
 */

import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

/**
 * Notion 风格的表格配置
 *
 * 特性：
 * - 启用列宽调整
 * - 允许表格宽度调整
 * - 最后一列自动填充剩余空间
 */
const NotionTable = Table.configure({
  resizable: true,
  handleWidth: 5,
  cellMinWidth: 100,
  lastColumnResizable: true,
  allowTableNodeSelection: true,
  HTMLAttributes: {
    class: "notion-table",
  },
});

/**
 * Notion 风格的表格行
 *
 * 特性：
 * - 悬停时显示操作按钮
 * - 支持拖拽重排
 */
const NotionTableRow = TableRow.configure({
  HTMLAttributes: {
    class: "notion-table-row",
  },
});

/**
 * Notion 风格的表格单元格
 *
 * 特性：
 * - 支持富文本内容
 * - 自动换行
 * - 垂直对齐顶部
 */
const NotionTableCell = TableCell.configure({
  HTMLAttributes: {
    class: "notion-table-cell",
  },
});

/**
 * Notion 风格的表头单元格
 *
 * 特性：
 * - 浅色背景区分
 * - 加粗文字
 * - 支持富文本
 */
const NotionTableHeader = TableHeader.configure({
  HTMLAttributes: {
    class: "notion-table-header",
  },
});

// 导出表格扩展组
export const TableExtension = [
  NotionTable,
  NotionTableRow,
  NotionTableCell,
  NotionTableHeader,
];

// 单独导出各组件（用于需要单独配置的场景）
export {
  NotionTable as CustomTable,
  NotionTableRow as CustomTableRow,
  NotionTableCell as CustomTableCell,
  NotionTableHeader as CustomTableHeader,
};
