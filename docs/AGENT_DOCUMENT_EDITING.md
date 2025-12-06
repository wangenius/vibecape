# Agent 文档编辑功能架构 (TAOP)

> **T**iptap **A**gent **O**peration **P**rotocol

本文档详细说明 Vibecape 中 Agent（Hero）如何实现对 Tiptap 文档的完整操控。

---

## 1. 设计理念

### 核心问题

Vibecape 是一个 Electron 应用，AI Agent 运行在**主进程 (Main Process)**，而 Tiptap 编辑器运行在**渲染进程 (Renderer Process)**。两者不能直接通信。

### 解决方案：IPC 桥接

```
┌────────────────────────┐           ┌────────────────────────┐
│      Main Process      │           │    Renderer Process    │
│                        │           │                        │
│  ┌──────────────────┐  │   IPC     │  ┌──────────────────┐  │
│  │   AI Agent       │──┼──────────▶│  │   useRemoteTools │  │
│  │   (LLM + Tools)  │  │           │  │   (Hook)         │  │
│  └────────┬─────────┘  │           │  └────────┬─────────┘  │
│           │            │           │           │            │
│  ┌────────▼─────────┐  │           │  ┌────────▼─────────┐  │
│  │  Document Tools  │  │           │  │   Tiptap Editor  │  │
│  │  (Tool Factory)  │  │           │  │   (JSONContent)  │  │
│  └──────────────────┘  │           │  └──────────────────┘  │
└────────────────────────┘           └────────────────────────┘
```

---

## 2. 三层工具架构

TAOP 将 Agent 的文档操作能力分为三层：

### 2.1 读取层 (Reading Layer)

| 工具                   | 返回值                            | 用途                       |
| ---------------------- | --------------------------------- | -------------------------- |
| `getDocumentText`      | `{content: string}`               | 获取纯文本，快速了解全文   |
| `getDocumentStructure` | `{outline: [{level, text, pos}]}` | 获取标题大纲，理解文档结构 |
| `getSelection`         | `{text, from, to, hasSelection}`  | 获取选中内容及位置         |

### 2.2 精确写入层 (Precise Writing Layer)

| 工具               | 输入                                           | 用途                                 |
| ------------------ | ---------------------------------------------- | ------------------------------------ |
| `insertParagraphs` | `{paragraphs: string[], position?}`            | 插入多个段落，自动换行               |
| `insertNodes`      | `{nodes: [{type, content, attrs}], position?}` | 插入结构化节点（标题、列表、代码块） |
| `setDocument`      | `{paragraphs: string[]}`                       | 全文替换（慎用）                     |

### 2.3 局部修改层 (Local Modification Layer)

| 工具               | 输入                       | 用途           |
| ------------------ | -------------------------- | -------------- |
| `replaceSelection` | `{content, asParagraphs?}` | 替换选中内容   |
| `replaceBySearch`  | `{search, replace, all?}`  | 按文本搜索替换 |
| `insertAtPosition` | `{position, content}`      | 在指定位置插入 |

### 2.4 文档管理层 (Document Management Layer)

这些工具直接在主进程执行，用于管理文档生命周期和组织结构。

**文件**: `src/main/heroes/tools/docs.ts`

| 工具                     | 输入                               | 用途               |
| ------------------------ | ---------------------------------- | ------------------ |
| `getDocumentTree`        | -                                  | 获取完整文档树结构 |
| `getDocumentInfo`        | `{docId}`                          | 获取单个文档详情   |
| `createDocument`         | `{title, parentId?, description?}` | 创建新文档         |
| `renameDocument`         | `{docId, newTitle}`                | 重命名文档         |
| `updateDocumentMetadata` | `{docId, metadata}`                | 更新文档元数据     |
| `moveDocument`           | `{docId, newParentId?}`            | 移动文档到新父级   |
| `reorderDocument`        | `{activeId, overId}`               | 调整文档顺序       |
| `deleteDocument`         | `{docId, confirm: true}`           | 删除文档（需确认） |
| `findDocumentByTitle`    | `{query, exact?}`                  | 按标题搜索文档     |

---

## 3. 核心实现

### 3.1 主进程：工具工厂

**文件**: `src/main/heroes/tools/document.ts`

```typescript
export const createDocumentTools = (webContents: WebContents) => {
  const executeRendererTool = async (name: string, args: any) => {
    // 1. 生成唯一请求 ID
    // 2. 发送 IPC 消息到渲染进程
    // 3. 等待渲染进程返回结果
    // 4. 30 秒超时保护
  };

  return {
    insertParagraphs: tool({
      description: "插入多个段落，自动换行",
      inputSchema: z.object({
        paragraphs: z.array(z.string()),
        position: z.enum(["cursor", "start", "end"]).optional(),
      }),
      execute: (args) => executeRendererTool("insertParagraphs", args),
    }),
    // ... 其他工具
  };
};
```

### 3.2 渲染进程：工具执行器

**文件**: `src/renderer/hooks/editor/useRemoteTools.ts`

```typescript
export const useRemoteTools = (editor: Editor | null) => {
  useEffect(() => {
    if (!editor) return;

    // 辅助函数：将字符串数组转换为段落 JSONContent
    const paragraphsToJSON = (paragraphs: string[]): JSONContent[] => {
      return paragraphs.map((text) => ({
        type: "paragraph",
        content: text ? [{ type: "text", text }] : [],
      }));
    };

    const handleToolExecute = (event, { id, name, args }) => {
      // 根据 name 分发到具体的 Tiptap 操作
      switch (name) {
        case "insertParagraphs":
          const nodes = paragraphsToJSON(args.paragraphs);
          editor.chain().focus().insertContent(nodes).run();
          break;
        // ... 其他 case
      }
    };

    window.electron.ipcRenderer.on("tool:execute", handleToolExecute);
  }, [editor]);
};
```

### 3.3 编辑器集成

**文件**: `src/renderer/components/editor/DocEditor.tsx`

```tsx
export const DocEditor = ({ doc, onChange, onSave }: Props) => {
  const editor = useEditor({
    /* ... */
  });

  // 启用远程工具控制
  useRemoteTools(editor);

  return <EditorContent editor={editor} />;
};
```

---

## 4. 典型使用场景

### 场景 1：用户选中文本，要求润色

```
用户: "帮我润色选中的内容"

Agent 调用流程:
1. getSelection() → {text: "原始文本", from: 10, to: 20}
2. (LLM 润色)
3. replaceSelection({content: "润色后的文本"})
```

### 场景 2：在文档末尾添加新章节

```
用户: "在末尾加一个总结章节"

Agent 调用流程:
1. insertNodes({
     nodes: [
       {type: "heading", content: "总结", attrs: {level: 2}},
       {type: "paragraph", content: "本文主要介绍了..."}
     ],
     position: "end"
   })
```

### 场景 3：替换文档中的特定词汇

```
用户: "把所有的'人工智能'改成'AI'"

Agent 调用流程:
1. replaceBySearch({search: "人工智能", replace: "AI", all: true})
   → {success: true, replaced: 5}
```

---

## 5. 扩展指南

### 添加新工具步骤

1. **主进程** (`document.ts`): 定义 `tool`，指定 `inputSchema` 和 `description`
2. **渲染进程** (`useRemoteTools.ts`): 在 `switch` 中添加对应 case，调用 Tiptap API
3. **测试**: 在 Chat 中发送对应指令，观察 Console 日志

### 支持的 Tiptap 节点类型

当前 `insertNodes` 支持：

- `heading` (attrs: `level`)
- `paragraph`
- `codeBlock` (attrs: `language`)
- `bulletList`
- `orderedList`

如需支持更多类型（如 `image`, `table`），请在 `nodeToJSON` 函数中添加对应转换逻辑。

---

## 6. 安全性与性能

### 安全性

- 所有操作由用户意图（Prompt）触发
- 运行在本地环境，无网络风险
- Agent 不能执行任意代码，只能调用预定义工具

### 性能优化

- IPC 通信开销极小（< 1ms）
- 大文档读取可能较慢，建议使用 `getSelection` 或 `getDocumentStructure` 缩小范围
- `replaceBySearch` 的 `all: true` 模式使用事务批量替换，性能较好

---

## 8. 内容转换模块

为支持 Agent 操作和导入/导出功能，项目提供了独立的内容转换模块：

**文件**: `@common/lib/content-converter.ts`

### API 概览

| 函数                                    | 用途                     |
| --------------------------------------- | ------------------------ |
| `markdownToJSON(md)`                    | Markdown → JSONContent   |
| `jsonToMarkdown(json)`                  | JSONContent → Markdown   |
| `parseMarkdownWithFrontmatter(content)` | 解析带 Frontmatter 的 MD |
| `stringifyWithFrontmatter(body, meta)`  | 合成带 Frontmatter 的 MD |
| `textToParagraphs(text)`                | 纯文本 → 段落文档        |
| `jsonToText(json)`                      | JSONContent → 纯文本     |

### 使用示例

```typescript
import { markdownToJSON, jsonToMarkdown } from "@common/lib/content-converter";

// Agent 可以生成 Markdown，然后转换为 JSONContent 插入
const markdown = `# 标题\n\n这是一个段落。\n\n- 列表项1\n- 列表项2`;
const jsonContent = markdownToJSON(markdown);
editor.commands.setContent(jsonContent);

// 或者读取 JSONContent，转换为 Markdown 供 LLM 理解
const doc = editor.getJSON();
const md = jsonToMarkdown(doc);
```

此模块可用于：

- Agent 工具（理解/生成结构化内容）
- 文档导入/导出
- 复制粘贴处理
- LLM 上下文构建
