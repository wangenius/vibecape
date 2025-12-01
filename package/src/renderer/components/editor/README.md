# 编辑器组件

本目录包含基于 **Tiptap** 的富文本编辑器组件，已完全替代之前的 Slate 编辑器。

## 📁 目录结构

```
editor/
├── TiptapEditor.tsx          # 主编辑器组件
├── SimpleTiptap.tsx          # 简化版编辑器
├── TiptapTools.tsx           # 编辑器工具函数
├── TiptapProse.ts            # 文本处理工具
├── tiptap-types.ts           # 类型定义
├── index.tsx                 # 统一导出
├── extensions/               # 自定义扩展
│   ├── MentionNode.tsx       # @提及功能
│   ├── PredictNode.tsx       # AI预测功能
│   ├── AnswerNode.tsx        # AI答案节点
│   ├── QuestionNode.tsx      # AI问答节点
│   └── OptimiseMark.tsx      # 优化标记
├── [旧文件 - 保留用于参考]
│   ├── SlateEditor.tsx       # (已废弃)
│   ├── SimpleSlate.tsx       # (已废弃)
│   ├── slate-types.ts        # (已废弃)
│   └── ...
└── README.md                 # 本文件
```

## 🚀 快速开始

### 基本用法

```typescript
import { TiptapEditor, TiptapContent, DEFAULT_TIPTAP_CONTENT } from '@/components/editor';

function MyComponent() {
  const [content, setContent] = useState<TiptapContent>(DEFAULT_TIPTAP_CONTENT);
  
  return (
    <TiptapEditor
      value={content}
      onChange={setContent}
      placeholder="开始输入..."
    />
  );
}
```

### 使用工具

```typescript
import { TiptapTools, TiptapProse } from '@/components/editor';

// 文本转内容
const content = TiptapProse.sharpen("Hello\nWorld");

// 内容转文本
const text = TiptapProse.flatten(content);
```

## 📦 主要组件

### TiptapEditor

功能完整的富文本编辑器，支持：
- ✅ 基础文本格式化
- ✅ @提及功能
- ✅ AI预测
- ✅ AI问答
- ✅ 优化标记
- ✅ 快捷键支持

```typescript
<TiptapEditor
  value={content}
  onChange={handleChange}
  readonly={false}
  autoFocus={true}
  placeholder="提示文字"
  className="custom-class"
  quickFocus={true}
/>
```

### SimpleTiptap

简化版编辑器，适用于简单场景：

```typescript
<SimpleTiptap
  defaultValue={content}
  onChange={handleChange}
  readonly={false}
  placeholder="提示文字"
/>
```

## 🛠️ 工具函数

### TiptapTools

编辑器操作工具：

```typescript
// 获取光标前的文本
TiptapTools.getTextBeforeCursor(editor, 100);

// 获取选中文本
TiptapTools.getSelectedText(editor);

// 插入文本
TiptapTools.insertText(editor, 'text');

// 光标操作
TiptapTools.getCursorPosition(editor);
TiptapTools.setCursorPosition(editor, pos);
```

### TiptapProse

内容转换工具：

```typescript
// 文本 <-> 内容
TiptapProse.sharpen(text);      // text -> content
TiptapProse.flatten(content);   // content -> text

// 内容操作
TiptapProse.contentAppend(content, text);  // 追加文本
TiptapProse.isEmpty(content);              // 检查是否为空
TiptapProse.getWordCount(content);         // 获取字数
```

## 🎨 自定义扩展

### Mention (@提及)

```typescript
editor.commands.setMention({ id: 'user-123', label: '张三' });
```

### Predict (AI预测)

```typescript
editor.commands.insertPredict('id', '预测文本');
editor.commands.updatePredict('id', '新文本');
editor.commands.removePredict();
```

### Question & Answer (问答)

```typescript
editor.commands.insertQuestion('问题内容');
editor.commands.insertAnswerNode('answer-id', true);
```

### Optimise (优化标记)

```typescript
editor.commands.setOptimise('optimise-id');
editor.commands.unsetOptimise();
editor.commands.toggleOptimise('optimise-id');
```

## 🔄 数据迁移

如需从旧的 Slate 格式迁移：

```typescript
import { slateToTiptap, autoConvert } from '@/lib/migration';

// 手动转换
const tiptapContent = slateToTiptap(slateContent);

// 自动检测并转换
const content = autoConvert(unknownContent);
```

## 📝 数据格式

### Tiptap 格式

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Hello World" }
      ]
    }
  ]
}
```

### TypeScript 类型

```typescript
import { TiptapContent } from '@/components/editor/tiptap-types';

// 使用类型
const content: TiptapContent = {
  type: 'doc',
  content: [...]
};
```

## 🔌 向后兼容

为了平滑过渡，保留了向后兼容的导出：

```typescript
// 这些导入仍然有效（实际是 Tiptap 组件）
import { SlateEditor } from '@/components/editor';
import { SimpleSlate } from '@/components/editor';
import { SlateTools } from '@/components/editor';
```

## ⚠️ 已废弃的文件

以下文件已被新组件替代，保留仅用于参考：

- ❌ `SlateEditor.tsx` -> ✅ `TiptapEditor.tsx`
- ❌ `SimpleSlate.tsx` -> ✅ `SimpleTiptap.tsx`
- ❌ `SlateTools.tsx` -> ✅ `TiptapTools.tsx`
- ❌ `slate-types.ts` -> ✅ `tiptap-types.ts`
- ❌ `Prose.ts` -> ✅ `TiptapProse.ts`

## 📚 更多文档

- [快速开始指南](../../../docs/tiptap-quick-start.md)
- [迁移指南](../../../docs/tiptap-migration.mdx)
- [完成总结](../../../docs/SLATE_TO_TIPTAP_完成总结.md)
- [Tiptap 官方文档](https://tiptap.dev/)

## 🎯 最佳实践

1. **使用类型安全**：始终使用 `TiptapContent` 类型
2. **工具函数优先**：使用 `TiptapTools` 和 `TiptapProse` 进行操作
3. **命令优先**：使用编辑器命令而非直接修改内容
4. **数据验证**：保存前验证内容格式
5. **错误处理**：捕获可能的转换错误

## 🐛 问题排查

### 常见问题

**Q: 内容无法更新？**
- 确保使用 `useState` 管理内容
- 检查 `onChange` 回调是否正确

**Q: 类型错误？**
- 确保导入了 `TiptapContent` 类型
- 使用迁移工具转换旧数据

**Q: 功能缺失？**
- 检查是否导入了所需的扩展
- 查看编辑器配置是否正确

## 💡 提示

- 使用 `quickFocus` 属性支持 `Ctrl+I` 快速聚焦
- 使用 `Alt+P` 触发 AI 预测
- 使用 `Tab` 接受预测文本
- 使用 `Alt+Q` 打开优化面板

---

**迁移状态**: ✅ 完成

**维护者**: Genesis Cosmos

**最后更新**: 2025-11-03

