# Vibecape AI 文档编辑系统设计文档

## 概述

本文档描述 Vibecape 中 AI 辅助文档编辑功能的整体设计，包括现有实现、问题分析和重新设计方案。

---

## 参考设计

根据业界最佳实践（参考 Tiptap AI 扩展），AI 编辑功能应具备以下核心能力：

### 核心特性

1. **上下文感知编辑** - 基于选中文本或当前位置进行编辑
2. **AI 建议作为可操作的 Diff** - 展示修改前后对比
3. **接受/拒绝变更** - 用户可以预览并决定是否应用
4. **流式结果直接在编辑器中** - 实时展示生成结果
5. **支持自定义 Schema** - 可扩展的节点类型

### 目标场景

- **选区润色** - 选中文本 → 输入指令 → 替换
- **续写生成** - 在光标位置 → 输入指令 → 生成新内容
- **智能校对** - 自动检查语法、拼写、风格问题

---

## 参考设计 - Tiptap AI Toolkit

Tiptap 官方 AI Toolkit 采用了轻量级设计，核心 API：

### 官方核心 API (HTML 模式)

```typescript
// 获取选中内容（HTML 格式）
const selection = toolkit.getHtmlSelection();

// 流式替换选区（HTML 格式）
await toolkit.streamHtml(readableStream, { position: "selection" });
```

### Vibecape 适配 (JSONContent 模式)

> **注意**: Vibecape 使用 **JSONContent** 格式存储文档，不是 HTML。
> AI 生成纯文本，我们直接流式插入纯文本到编辑器。

```typescript
// 获取选中内容（纯文本）
const selection = editor.state.doc.textBetween(from, to);

// 流式插入纯文本（Tiptap 自动转换为 JSONContent）
editor.commands.insertContentAt(position, text);
```

### 设计特点

1. **不插入特殊节点** - 直接操作编辑器
2. **流式替换** - AI 生成的内容实时替换选区
3. **保持简洁** - 最少的抽象层

### 官方功能列表

- **Inline Edits** - 选中文本 → 发指令 → 流式替换
- **Review Changes** - 显示 Diff，用户接受/拒绝
- **Tool Streaming** - 实时显示 AI 操作
- **Autocompletion** - Tab 触发自动补全
- **Selection Awareness** - 只传递选中内容给 AI

---

## 现有实现分析

### 1. AIRewriteNode - 当前问题

**现有设计**:

- 作为独立的 Block 节点插入文档中
- 内含输入框，用户输入指令后流式生成
- 生成完成后显示结果，点击应用/取消

**存在问题**:

1. **体验割裂** - 插入一个"块"来编辑，打断写作流程
2. **模式混乱** - `generate` 和 `polish` 两种模式共用一个组件，逻辑复杂
3. **视觉突兀** - 独立块在文档中显得格格不入
4. **交互繁琐** - 需要先触发插入，再输入指令，步骤多
5. **位置问题** - 生成模式插入位置不够直观,Polish Mark 关联复杂

### 2. PolishManager - 未使用

**现有设计**:

- 独立组件管理润色请求
- Popover 形式显示 Diff 对比视图

**存在问题**:

- 调用 `api?.ai?.optimiseStart`，此 API 可能未正确配置
- 与 AIRewriteNode 的 `insertAIPolish` 功能重复
- 实际未被有效使用

### 3. 前端工具的选区依赖问题 ✅ 已解决

**已移除的问题工具** (document.ts):

| 工具               | 问题                       | 状态   |
| ------------------ | -------------------------- | ------ |
| `insertParagraphs` | 默认 `position: "cursor"`  | 已移除 |
| `insertNodes`      | 默认 `position: "cursor"`  | 已移除 |
| `replaceSelection` | 完全依赖当前选区           | 已移除 |
| `insertAtPosition` | 依赖位置可能变化           | 已移除 |
| `getSelection`     | 选区可能变化，读取没有意义 | 已移除 |

**保留的安全工具** (document.ts):

| 工具                   | 说明                       |
| ---------------------- | -------------------------- |
| `getDocumentText`      | 读取文档内容               |
| `getDocumentStructure` | 读取文档大纲               |
| `insertAtStart`        | 在文档开头插入（固定位置） |
| `insertAtEnd`          | 在文档末尾插入（固定位置） |
| `setDocument`          | 替换整文档                 |
| `replaceBySearch`      | 搜索替换（不依赖选区） ✅  |
| `focusEditor`          | 辅助工具                   |

**后端工具** (docContent.ts) - 推荐使用：

- `readDocumentContent` - 读取指定文档
- `searchAndReplaceInDoc` - 搜索替换
- `appendToDocument` / `prependToDocument` - 头尾插入
- `insertAfterTextInDoc` / `insertBeforeTextInDoc` - 按文本位置插入
- `setDocumentContent` / `setDocumentFromMarkdown` - 替换整文档

## 推荐方案: 轻量级流式替换 ✅ 已实现

参考 Tiptap 官方设计，采用最简洁的方式：**不插入特殊节点，直接流式替换选区**。

### 实现文件

- `AIInlineEdit.ts` - Tiptap Extension (Cmd+K 触发)
- `AIEditPopover.tsx` - 浮层 UI 组件

### 核心思路

```typescript
// 1. 用户选中文本，触发 AI 编辑
// 2. 记录当前选区信息
const selection = getSelection(editor);

// 3. 调用 AI 生成，流式替换选区
await streamReplace({
  editor,
  selection,
  instruction: prompt,
  onDelta: (text) => {
    // 实时更新编辑器内容
  },
});
```

### 交互流程

```
1. 用户选中文本
2. 按 Cmd+K 弹出指令输入框（小浮层，跟随光标）
3. 输入指令后按 Enter
4. AI 流式生成，直接替换选中内容（实时可见）
5. 完成，无需额外确认
```

### 引用格式 (Chat Ref)

为了让 AI 更精确地理解和修改文档，我们采用了结构化的引用格式：

```json
[REF]{
  "type": "text",
  "docId": "...",
  "text": "选中的文本内容",
  "position": { "from": 100, "to": 120 },
  "context": {
    "before": "前文...",
    "after": "后文..."
  },
  "paragraph": "所在段落完整文本"
}[/REF]
```

这种格式通过 `[REF]` 标签包裹 JSON 数据，包含了精确的位置信息和上下文，使 AI 能够：

1.  使用 `searchAndReplaceInDoc` 精确定位（通过 paragraph 匹配）
2.  理解上下文语境
3.  知道确切的文档来源
    addCommands() {
    return {
    // 获取当前选中内容
    getSelection:
    () =>
    ({ state }) => {
    const { from, to } = state.selection;
    if (from === to) return null;
    return {
    from,
    to,
    text: state.doc.textBetween(from, to),
    };
    },

        // 流式替换选区
        streamReplace:
          (stream: ReadableStream) =>
          async ({ editor, state }) => {
            const { from, to } = state.selection;
            if (from === to) return false;

            // 先删除选中内容
            editor.chain().focus().deleteSelection().run();

            // 记录当前位置
            let currentPos = from;

            // 读取流并实时插入
            const reader = stream.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const text = decoder.decode(value, { stream: true });
              editor.commands.insertContentAt(currentPos, text);
              currentPos += text.length;
            }

            return true;
          },

    };
    },

addKeyboardShortcuts() {
return {
"Mod-k": () => {
// 触发 AI 编辑 UI
const event = new CustomEvent("ai:edit:trigger", {
detail: this.editor.commands.getSelection(),
});
window.dispatchEvent(event);
return true;
},
};
},
});

````

#### 2. AI 编辑浮层组件

```typescript
// components/AIEditInput.tsx
import { useState, useEffect } from "react";
import { Editor } from "@tiptap/react";

interface AIEditInputProps {
  editor: Editor;
  selection: { from: number; to: number; text: string };
  onClose: () => void;
}

export const AIEditInput = ({
  editor,
  selection,
  onClose,
}: AIEditInputProps) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);

    try {
      // 调用 AI API 获取流
      const response = await fetch("/api/ai/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selection: selection.text,
          instruction: prompt,
          context: editor.state.doc.textBetween(
            Math.max(0, selection.from - 200),
            selection.from
          ),
        }),
      });

      if (!response.body) throw new Error("No stream");

      // 流式替换选区
      await editor.commands.streamReplace(response.body);
      onClose();
    } catch (error) {
      console.error("AI edit failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed z-50 bg-popover border rounded-lg shadow-lg p-2 min-w-[300px]">
      <div className="text-xs text-muted-foreground mb-1">
        编辑: "{selection.text.slice(0, 30)}..."
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="输入修改指令..."
          className="flex-1 bg-transparent outline-none"
          autoFocus
        />
        {isLoading && <Loader2 className="animate-spin" />}
      </div>
    </div>
  );
};
````

### 与现有方案对比

| 方面       | 现有 AIRewriteNode | 新方案 streamReplace |
| ---------- | ------------------ | -------------------- |
| 文档结构   | 插入临时节点       | 不修改结构           |
| 交互步骤   | 多步骤             | 最少步骤             |
| 代码复杂度 | 高 (700+ 行)       | 低 (~150 行)         |
| 取消/撤销  | 需要恢复逻辑       | Cmd+Z 原生撤销       |
| 流式体验   | 在节点内显示       | 直接在正文显示       |

### 实现步骤

1. **创建 AIToolkit Extension** - 提供 `getSelection` 和 `streamReplace` 命令
2. **创建 AIEditInput 组件** - 浮层输入指令
3. **修改 BubbleMenu** - AI 按钮触发浮层
4. **添加 Cmd+K 快捷键** - 快速触发
5. **删除旧代码** - `AIRewriteNode`, `PolishManager`, `AIPolishMark`

---

## 方案 A: 浮层编辑模式

### 设计目标

选中文本后，在选区附近弹出浮层进行 AI 编辑。

### 交互流程

```
1. 用户选中文本
2. 点击 BubbleMenu 中的「AI」按钮
3. 弹出浮层:
   ┌─────────────────────────────────────┐
   │ 🔮 AI 编辑                          │
   ├─────────────────────────────────────┤
   │ 原文:                               │
   │ "这是一段需要润色的文字..."          │
   ├─────────────────────────────────────┤
   │ 指令: [改得更生动一些_________]      │
   ├─────────────────────────────────────┤
   │ 建议:                               │
   │ "这是一段富有感染力的文字..."        │
   │ [流式生成中...]                      │
   ├─────────────────────────────────────┤
   │        [取消]  [重试]  [应用]       │
   └─────────────────────────────────────┘
4. 点击「应用」替换原文
```

### 技术实现

```typescript
// 新组件: AIEditPopover.tsx
interface AIEditPopoverProps {
  editor: Editor;
  selection: { from: number; to: number; text: string };
  onClose: () => void;
}

const AIEditPopover = ({ editor, selection, onClose }: AIEditPopoverProps) => {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  // 流式生成
  const handleGenerate = async () => {
    setStatus("loading");
    // 调用 AI 生成，流式更新 result
    await streamGenerate({
      originalText: selection.text,
      instruction: prompt,
      onDelta: (text) => setResult((prev) => prev + text),
      onComplete: () => setStatus("done"),
    });
  };

  // 应用结果
  const handleApply = () => {
    editor
      .chain()
      .focus()
      .setTextSelection(selection)
      .deleteSelection()
      .insertContent(result)
      .run();
    onClose();
  };

  return <Popover position={selection.position}>{/* UI 实现 */}</Popover>;
};
```

### 优点

- 轻量级，不污染文档结构
- 保留 selection 信息，应用直接
- 交互集中，一个浮层完成

### 缺点

- 需要追踪 selection 位置，用户可能点击别处导致失焦
- 浮层遮挡编辑区

---

## 方案 B: Inline 标记替换模式（推荐）

### 设计目标

选中文本后，原地标记并在下方展示 AI 建议，类似 GitHub Copilot 的内联建议。

### 交互流程

```
1. 用户选中文本
2. 按 Cmd+K 或点击 BubbleMenu「AI」
3. 编辑器中:

   这是普通文字。
   ╔════════════════════════════════════╗
   ║ 这是一段需要润色的文字...          ║  ← 选中文本（带边框）
   ╟────────────────────────────────────╢
   ║ [改得更生动一些______________] ⏎    ║  ← 指令输入
   ╟────────────────────────────────────╢
   ║ ✨ 这是一段富有感染力的文字...      ║  ← AI 建议（流式）
   ║                                    ║
   ║      [Esc 取消]  [Tab 应用]         ║  ← 快捷键
   ╚════════════════════════════════════╝
   这是后续文字。

4. 按 Tab 应用，原文被替换
```

### 技术实现

#### 新节点: AIEditBlock

```typescript
// AIEditBlock.tsx
export const AIEditBlock = Node.create({
  name: "aiEditBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      id: { default: null },
      originalText: { default: "" }, // 保存原文
      originalFrom: { default: 0 }, // 原文开始位置
      originalTo: { default: 0 }, // 原文结束位置
      status: { default: "input" }, // input | loading | done | error
      result: { default: "" }, // AI 生成结果
    };
  },

  addCommands() {
    return {
      insertAIEdit:
        () =>
        ({ state, tr, dispatch }) => {
          const { from, to } = state.selection;
          if (from === to) return false; // 需要选中文本

          const originalText = state.doc.textBetween(from, to);
          const id = `ai-edit-${Date.now()}`;

          // 删除选中文本，插入 AIEditBlock
          const node = state.schema.nodes.aiEditBlock.create({
            id,
            originalText,
            originalFrom: from,
            originalTo: to,
          });

          tr.delete(from, to).insert(from, node);
          if (dispatch) dispatch(tr);
          return true;
        },

      applyAIEdit:
        (id: string) =>
        ({ state, tr, dispatch }) => {
          // 找到节点，提取 result，替换为正式内容
          let targetPos = null;
          let result = "";

          state.doc.descendants((node, pos) => {
            if (node.type.name === "aiEditBlock" && node.attrs.id === id) {
              targetPos = pos;
              result = node.attrs.result;
              return false;
            }
          });

          if (targetPos !== null && result) {
            const paragraphs = result.split("\n").filter(Boolean);
            const nodes = paragraphs.map((text) =>
              state.schema.nodes.paragraph.create(null, state.schema.text(text))
            );
            tr.replaceWith(targetPos, targetPos + 1, nodes);
            if (dispatch) dispatch(tr);
            return true;
          }
          return false;
        },

      cancelAIEdit:
        (id: string) =>
        ({ state, tr, dispatch }) => {
          // 找到节点，恢复原文
          let targetPos = null;
          let originalText = "";

          state.doc.descendants((node, pos) => {
            if (node.type.name === "aiEditBlock" && node.attrs.id === id) {
              targetPos = pos;
              originalText = node.attrs.originalText;
              return false;
            }
          });

          if (targetPos !== null) {
            const paragraphNode = state.schema.nodes.paragraph.create(
              null,
              originalText ? state.schema.text(originalText) : null
            );
            tr.replaceWith(targetPos, targetPos + 1, paragraphNode);
            if (dispatch) dispatch(tr);
            return true;
          }
          return false;
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AIEditBlockComponent);
  },

  addKeyboardShortcuts() {
    return {
      "Mod-k": () => this.editor.commands.insertAIEdit(),
    };
  },
});
```

#### 组件实现

```typescript
function AIEditBlockComponent({ node, editor, updateAttributes }) {
  const { id, originalText, status, result } = node.attrs;
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动聚焦
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 键盘快捷键
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
    if (e.key === "Tab" && status === "done") {
      e.preventDefault();
      editor.commands.applyAIEdit(id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      editor.commands.cancelAIEdit(id);
    }
  };

  // 流式生成
  const handleGenerate = async () => {
    updateAttributes({ status: "loading", result: "" });

    try {
      await streamGenerate({
        originalText,
        instruction: prompt,
        context: getEditorContext(editor),
        onDelta: (text) => {
          updateAttributes({ result: (node.attrs.result || "") + text });
        },
        onComplete: () => {
          updateAttributes({ status: "done" });
        },
      });
    } catch (error) {
      updateAttributes({ status: "error" });
    }
  };

  return (
    <NodeViewWrapper className="ai-edit-block">
      <div className="border-2 border-primary/30 rounded-lg p-3 my-2 bg-muted/50">
        {/* 原文展示 */}
        <div className="text-sm text-muted-foreground mb-2">
          <span className="text-xs font-medium">原文:</span>
          <div className="mt-1 line-through opacity-60">{originalText}</div>
        </div>

        {/* 指令输入 */}
        {status === "input" && (
          <div className="flex items-center gap-2 border-t pt-2">
            <Sparkles className="size-4 text-primary" />
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入修改指令..."
              className="flex-1 bg-transparent resize-none outline-none"
            />
          </div>
        )}

        {/* AI 结果 */}
        {(status === "loading" || status === "done") && result && (
          <div className="border-t pt-2 mt-2">
            <span className="text-xs font-medium text-primary">建议:</span>
            <div className="mt-1 text-sm">
              {result}
              {status === "loading" && (
                <span className="inline-block w-1 h-4 bg-primary animate-pulse" />
              )}
            </div>
          </div>
        )}

        {/* 快捷键提示 */}
        {status === "done" && (
          <div className="text-xs text-muted-foreground mt-2 flex gap-4">
            <span>Tab 应用</span>
            <span>Esc 取消</span>
            <span>Enter 重试</span>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
```

### 优点

- 原地编辑，上下文清晰
- 原文被"保存"在节点中，取消时可恢复
- 键盘快捷键驱动，高效
- 不依赖外部 selection 状态

### 缺点

- 仍需插入临时节点
- 复杂文档结构中可能有兼容问题

---

## 方案 C: 后端驱动模式（通过 Chat）

### 设计目标

用户在 Chat 中引用选区，AI 直接修改数据库，前端接收通知刷新。

### 交互流程

```
1. 用户选中文本，按 Cmd+L 引用到 Chat
2. Chat 输入框显示引用:
   ┌─────────────────────────────────────┐
   │ [📄 引用: "这是一段文字..."]          │
   │ 改得更生动一些                       │
   └─────────────────────────────────────┘
3. AI 调用 searchAndReplaceInDoc 工具
4. 前端收到 docs:changed 通知，文档自动刷新
```

### 已有实现

- `RefExtension` - Chat 中的引用系统
- `docContent.ts` - 后端文档编辑工具
- `docs:changed` - 通知机制

### 需要增强

- 引用时记录 docId + 原文
- AI 优先通过搜索原文定位并替换

### 优点

- 不污染编辑器
- 利用现有 Chat 基础设施
- 后端修改，更可靠

### 缺点

- 需要切换到 Chat 面板
- 依赖文本搜索定位，可能有重复文本问题

---

## 推荐实现顺序

### Phase 1: 优化后端编辑能力（已完成）

- ✅ `docContent.ts` - 后端文档内容编辑工具
- ✅ `docs:changed` 通知机制
- ✅ 前端自动刷新

### Phase 2: 重构 AIRewriteNode → AIEditBlock

1. 创建新的 `AIEditBlock` 节点，替代 `AIRewriteNode`
2. 简化交互：选中 → Cmd+K → 输入指令 → Tab 应用
3. 保存原文，支持取消恢复
4. 删除冗余的 `PolishManager` 和 `AIPolishMark`

### Phase 3: 增强 Chat 编辑能力

1. 引用时传递 docId + 原文
2. AI 优先使用 `searchAndReplaceInDoc`
3. 支持"不知道在哪个文档"时的模糊搜索

### Phase 4: 快捷命令

1. SlashMenu 中添加 AI 命令
2. 支持预设指令：润色、续写、缩写、扩写、翻译

---

## 清理计划

### 要删除的文件/代码

1. `PolishManager.tsx` - 未有效使用
2. `PolishDiffView.tsx` - 随 PolishManager 删除
3. `AIPolishMark` - 并入新设计
4. `AIRewriteNode` 中的 `mode: "polish"` 相关逻辑

### 要保留和优化的

1. `AIRewriteNode` → 重构为 `AIEditBlock`
2. `docContent.ts` 后端编辑工具
3. `RefExtension` Chat 引用系统
4. BubbleMenu 中的 AI 按钮（调用新组件）

---

## 工具层总结

### 后端工具 (直接操作数据库)

| 工具                      | 功能          | 使用场景         |
| ------------------------- | ------------- | ---------------- |
| `readDocumentContent`     | 读取文档内容  | AI 理解文档      |
| `searchAndReplaceInDoc`   | 搜索替换      | **核心编辑操作** |
| `appendToDocument`        | 追加内容      | 续写场景         |
| `setDocumentContent`      | 替换整文档    | 全文重写         |
| `setDocumentFromMarkdown` | Markdown 设置 | 格式化写入       |

### 前端工具 (操作 Tiptap 编辑器)

| 工具           | 功能           | 使用场景 |
| -------------- | -------------- | -------- |
| `insertAIEdit` | 插入 AI 编辑块 | 选区润色 |
| `applyAIEdit`  | 应用 AI 结果   | 确认修改 |
| `cancelAIEdit` | 取消并恢复     | 放弃修改 |

---

## 快捷键规划

| 快捷键  | 功能                      |
| ------- | ------------------------- |
| `Cmd+K` | 选中文本 → 触发 AI 编辑   |
| `Cmd+L` | 选中文本 → 引用到 Chat    |
| `Tab`   | 在 AI 编辑块中 → 应用结果 |
| `Esc`   | 在 AI 编辑块中 → 取消恢复 |
| `Enter` | 在 AI 编辑块中 → 提交指令 |
