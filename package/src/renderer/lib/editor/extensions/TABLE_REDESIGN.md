# Notion-like 表格重构说明

## 概述

将 Vibecape 编辑器的表格组件重新设计为 Notion 风格，提供更简洁优雅的视觉效果和更流畅的交互体验。

## 研究成果：Notion 表格的核心特点

### 1. 视觉设计

- **极简边框**：使用细线边框（1px），颜色柔和不突兀
- **清晰的表头**：浅色背景区分，字体略小且加粗
- **圆角设计**：表格整体圆角（6px），视觉更柔和
- **阴影效果**：轻微的阴影提升层次感
- **间距合理**：单元格内边距适中（0.5rem 0.75rem）

### 2. 交互体验

- **悬停反馈**：
  - 行悬停时显示浅色背景
  - 列宽调整手柄仅在悬停时显示
  - 表头行不参与悬停效果
- **选中状态**：
  - 选中单元格有明显的蓝色边框
  - 背景色为半透明蓝色
- **流畅过渡**：
  - 所有交互都有 0.15-0.2s 的过渡动画
  - 视觉反馈即时但不突兀

### 3. 功能特性

- **列宽调整**：拖拽列边框调整宽度
- **富文本支持**：单元格内支持格式化文本
- **自动换行**：长文本自动换行显示
- **Tab 导航**：使用 Tab 键在单元格间移动
- **最小宽度**：单元格最小宽度 100px，保证可读性

## 实现改进

### TableExtension.ts 改进

#### 之前的问题：

```typescript
// 配置过于简单，缺少关键功能
const CustomTable = Table.configure({
  resizable: true,
  HTMLAttributes: {
    class: "custom-table",
  },
});
```

#### 改进后：

```typescript
// 完整的 Notion 风格配置
const NotionTable = Table.configure({
  resizable: true, // 启用列宽调整
  handleWidth: 5, // 调整手柄宽度
  cellMinWidth: 100, // 单元格最小宽度
  lastColumnResizable: true, // 最后一列可调整
  allowTableNodeSelection: true, // 允许选择整个表格
  HTMLAttributes: {
    class: "notion-table",
  },
});
```

### TableBubbleMenu.tsx 改进

#### 关键改进：按钮位置紧贴边框线

**之前的问题：**

```tsx
// 按钮悬浮在表格外部
<HandleButton
  style={{
    top: table.top - 10, // 在表格上方 10px
    left: table.left - 10, // 在表格左侧 10px
  }}
/>
```

**改进后：**

```tsx
// 按钮紧贴在边框线上
<HandleButton
  className="size-5 rounded-br-md"
  style={{
    top: table.top - 1, // 紧贴边框线
    left: table.left - 1, // 紧贴边框线
  }}
/>
```

#### 按钮样式改进

**之前：**

- 有明显的边框和阴影
- 始终可见
- 视觉上与表格分离

**改进后：**

- 半透明背景 (`bg-muted/80`)
- 毛玻璃效果 (`backdrop-blur-sm`)
- 默认隐藏，悬停时显示 (`opacity-0 group-hover:opacity-100`)
- 与边框线融为一体

#### 三个操作按钮的位置

1. **表格操作按钮**（左上角）

   ```tsx
   top: table.top - 1,
   left: table.left - 1,
   className: "size-5 rounded-br-md"  // 右下圆角
   ```

2. **列操作按钮**（顶部居中）

   ```tsx
   top: cell.top - 1,
   left: cell.left + (cell.width / 2) - 24,
   className: "w-12 h-4 rounded-b-md"  // 底部圆角
   ```

3. **行操作按钮**（左侧居中）
   ```tsx
   top: cell.top + (cell.height / 2) - 24,
   left: cell.left - 1,
   className: "w-4 h-12 rounded-r-md"  // 右侧圆角
   ```

### editor.css 样式改进

#### 主要变化：

1. **表格布局**

   ```css
   /* 之前：border-collapse: separate */
   border-collapse: collapse !important;

   /* 添加阴影和圆角 */
   box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
   border-radius: 0.375rem !important;
   ```

2. **行悬停效果**（新增）

   ```css
   .tiptap table tbody tr:hover {
     background-color: rgba(0, 0, 0, 0.02) !important;
   }
   ```

3. **表头优化**

   ```css
   /* 更柔和的文字颜色 */
   color: var(--muted-foreground) !important;
   /* 更小的字号 */
   font-size: 0.8125rem !important;
   ```

4. **单元格改进**

   ```css
   /* 支持自动换行 */
   word-wrap: break-word !important;
   overflow-wrap: break-word !important;

   /* 背景透明，继承行的悬停效果 */
   background: transparent !important;
   ```

5. **列宽调整手柄**

   ```css
   /* 三态显示：隐藏 -> 半透明 -> 完全显示 */
   opacity: 0 !important;

   table:hover .column-resize-handle {
     opacity: 0.6 !important;
   }

   .column-resize-handle:active {
     opacity: 1 !important;
   }
   ```

6. **焦点状态**（新增）

   ```css
   .tiptap table:focus-within {
     box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
   }
   ```

7. **空单元格占位符**（新增）
   ```css
   .tiptap table td:empty::before {
     content: "" !important;
     display: inline-block !important;
     width: 1px !important;
     height: 1.5em !important;
   }
   ```

## 视觉对比

### 之前的问题：

- ❌ 边框过粗，视觉沉重
- ❌ 缺少悬停反馈
- ❌ 表头样式不够突出
- ❌ 没有阴影，缺少层次感
- ❌ 圆角过大（0.5rem）
- ❌ 列宽调整手柄一直显示，干扰阅读

### 改进后：

- ✅ 细线边框，视觉清爽
- ✅ 行悬停时有微妙的背景色变化
- ✅ 表头使用 muted-foreground 颜色，更柔和
- ✅ 轻微阴影提升层次感
- ✅ 适中的圆角（0.375rem）
- ✅ 列宽调整手柄仅在需要时显示

## 暗色模式优化

针对暗色模式进行了特别优化：

```css
/* 更明显的边框 */
border-color: rgba(255, 255, 255, 0.1) !important;

/* 更深的阴影 */
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3) !important;

/* 表头背景更明显 */
background-color: rgba(255, 255, 255, 0.05) !important;

/* 悬停效果更明显 */
background-color: rgba(255, 255, 255, 0.03) !important;
```

## 交互改进总结

| 功能       | 之前         | 现在                  |
| ---------- | ------------ | --------------------- |
| 行悬停     | 无反馈       | 浅色背景高亮          |
| 列宽调整   | 手柄一直显示 | 悬停时显示            |
| 单元格选中 | 基础高亮     | 蓝色边框 + 半透明背景 |
| 表格焦点   | 无反馈       | 蓝色光晕              |
| 空单元格   | 高度塌陷     | 占位符保持高度        |
| 过渡动画   | 无           | 0.15-0.2s 平滑过渡    |

## 使用建议

### 创建表格

```typescript
editor
  .chain()
  .focus()
  .insertTable({
    rows: 3,
    cols: 3,
    withHeaderRow: true,
  })
  .run();
```

### 表格操作

- **添加行**：`editor.chain().focus().addRowAfter().run()`
- **添加列**：`editor.chain().focus().addColumnAfter().run()`
- **删除行**：`editor.chain().focus().deleteRow().run()`
- **删除列**：`editor.chain().focus().deleteColumn().run()`
- **合并单元格**：`editor.chain().focus().mergeCells().run()`
- **拆分单元格**：`editor.chain().focus().splitCell().run()`

### 键盘快捷键

- **Tab**：移动到下一个单元格
- **Shift + Tab**：移动到上一个单元格
- **Enter**：在单元格内换行

## 技术细节

### CSS 优先级策略

使用 `!important` 确保样式覆盖 prose 等第三方样式：

```css
.tiptap table,
.ProseMirror table,
.prose table,
.prose-sm table,
[class*="prose"] table {
  /* 样式 */
}
```

### 圆角处理

针对四个角的单元格分别设置圆角：

- 左上角：第一行第一列
- 右上角：第一行最后一列
- 左下角：最后一行第一列
- 右下角：最后一行最后一列

### 边框处理

- 使用 `border-collapse: collapse` 避免双边框
- 最后一列移除右边框
- 最后一行移除底边框
- 表格外层有统一边框

## 未来改进方向

1. **表格工具栏**
   - 添加浮动工具栏用于快速操作
   - 包含添加/删除行列、合并单元格等功能

2. **列类型**
   - 支持不同的列类型（文本、数字、日期等）
   - 每种类型有特定的格式化和验证

3. **排序和筛选**
   - 点击表头进行排序
   - 添加筛选功能

4. **拖拽重排**
   - 支持拖拽行和列进行重新排序

5. **单元格样式**
   - 支持单元格背景色
   - 支持文字对齐方式

## 参考资料

- [Notion 表格功能文档](https://www.notion.so/help/tables)
- [Tiptap Table Extension](https://tiptap.dev/api/nodes/table)
- [Notion 设计系统研究](https://www.notion.vip/notion-tables/)
