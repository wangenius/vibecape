# Vibecape AI/LLM 开发文档

> 本文档为大语言模型 (LLM/AI) 阅读和理解 Vibecape 项目而编写

---

## 1. 项目概述

**Vibecape** 是一个基于 Electron 的本地优先文档编辑器，采用 Notion 风格的 WYSIWYG 编辑体验。

### 核心技术栈

| 层级     | 技术                        | 用途           |
| -------- | --------------------------- | -------------- |
| 桌面框架 | Electron                    | 跨平台桌面应用 |
| UI 框架  | React + TypeScript          | 渲染层组件     |
| 编辑器   | Tiptap (ProseMirror)        | 富文本编辑     |
| 数据库   | SQLite + Drizzle ORM        | 本地持久化     |
| 状态管理 | Zustand                     | 前端状态       |
| 样式     | TailwindCSS + CSS Variables | 主题系统       |
| AI 集成  | Vercel AI SDK               | LLM 交互       |

---

## 2. 目录结构

```
vibecape/
├── package/                    # Electron 应用
│   ├── src/
│   │   ├── main/              # 主进程 (Node.js)
│   │   │   ├── heroes/        # ⭐ AI Agent 系统
│   │   │   ├── services/      # 核心服务层
│   │   │   ├── handler/       # IPC 处理器
│   │   │   └── db/            # 数据库访问
│   │   ├── renderer/          # 渲染进程 (React)
│   │   │   ├── components/    # UI 组件
│   │   │   ├── hook/          # React Hooks
│   │   │   ├── @styles/       # 样式和主题
│   │   │   └── locales/       # 国际化
│   │   ├── common/            # 主/渲染共享代码
│   │   │   ├── schema/        # Drizzle 数据库模式
│   │   │   └── types/         # TypeScript 类型
│   │   └── preload/           # Electron Preload
│   └── out/                   # 构建产物
└── homepage/                  # 官网 (Next.js)
```

---

## 3. 核心架构

### 3.1 进程通信 (IPC)

```
┌─────────────────┐    IPC Bridge    ┌─────────────────┐
│    Renderer     │ ◄──────────────► │      Main       │
│   (React UI)    │                  │   (Node.js)     │
│                 │                  │                 │
│ window.api.*    │                  │ ipcMain.handle  │
│ useChatStore    │                  │ Services/*.ts   │
└─────────────────┘                  └─────────────────┘
```

**关键调用路径**：

```typescript
// 渲染进程调用
await window.api.vibecape.getDoc(id);

// 主进程处理 (handler/docs/index.ts)
ipcMain.handle("vibecape:getDoc", (_, id) => DocsService.getDoc(id));
```

### 3.2 数据存储架构

参见 [DATA_STORAGE.md](file:///Users/wangenius/Documents/github/vibecape/package/DATA_STORAGE.md)

```
~/vibecape/                    # 用户目录
├── config.json                # 应用配置
├── app.db                     # AI 配置 (providers, models)
├── chat.db                    # 全局聊天记录
└── workspaces.json            # 工作区索引

{docs_root}/                   # 文档根目录
└── {workspace_id}/            # 各工作区
    ├── config.json            # 工作区配置
    ├── docs.db                # 文档数据库
    ├── chat.db                # 项目聊天
    └── llm.txt                # AI 上下文提示词
```

---

## 4. Hero/Agent AI 系统

### 4.1 架构概览

Hero 是对 AI Agent 的封装，每个 Hero 具有独特的人格和能力。

```
heroes/
├── Hero.ts               # Hero 基类
├── HeroesManager.ts      # 单例管理器
├── presets/              # 预设 Hero
│   ├── nova/             # 通用助手
│   ├── sage/             # 知识顾问
│   ├── muse/             # 创意写作
│   ├── max/              # 效率专家
│   ├── iris/             # 分析师
│   └── luca/             # 代码助手
└── tools/                # 工具集
    └── common.ts         # 通用工具
```

### 4.2 Hero 定义结构

```typescript
// presets/nova/index.ts
export const nova = new Hero({
  ...info, // info.json: id, name, avatar, description
  prompt: { en, zh }, // en.txt/zh.txt: 系统提示词
  tools: commonTools, // 可用工具
  maxSteps: 20, // Agent 最大步数
});
```

**预设 Hero 文件结构**：

```
nova/
├── index.ts       # Hero 实例导出
├── info.json      # 元数据 { id, name, avatar, description }
├── en.txt         # 英文系统提示词
└── zh.txt         # 中文系统提示词
```

### 4.3 Hero 类核心 API

```typescript
class Hero {
  readonly id: string;
  readonly prompt: BilingualPrompt;
  readonly tools: Record<string, Tool>;

  // 获取元数据 (用于 UI)
  getMeta(): HeroMeta;

  // 根据语言获取系统提示词
  getSystemPrompt(language: LocaleLike): string;

  // 创建 AI SDK Agent 实例
  createAgent(model: LanguageModel, language: LocaleLike): AIAgent;
}
```

### 4.4 工具系统

工具使用 Vercel AI SDK 的 `tool()` 函数定义：

```typescript
// tools/common.ts
export const commonTools = {
  getCurrentTime: tool({
    description: "获取当前的日期和时间",
    inputSchema: z.object({}),
    execute: async () => ({
      date: now.toLocaleDateString("zh-CN"),
      time: now.toLocaleTimeString("zh-CN"),
      timestamp: now.toISOString(),
    }),
  }),
};
```

---

## 5. 文档编辑系统

### 5.1 Tiptap 编辑器

编辑器位于 `renderer/components/editor/`：

| 文件                | 功能               |
| ------------------- | ------------------ |
| `DocEditor.tsx`     | 主编辑器组件       |
| `extensions/`       | 15 个自定义扩展    |
| `menus/`            | 斜杠命令、气泡菜单 |
| `PolishManager.tsx` | AI 润色功能        |

**关键扩展**：

- `AIRewriteNode.tsx` - AI 重写节点
- `CodeBlockNode.tsx` - 代码块
- `Admonition.tsx` - 提示块 (note/warning/tip)
- `ImageNode.tsx` - 图片节点
- `Mention.tsx` - @提及
- `SlashCommand.ts` - 斜杠命令

### 5.2 文档数据模式

```typescript
// common/schema/docs.ts
export const docs = sqliteTable("docs", {
  id: id("id"),
  parent_id: text("parent_id"), // 父节点 ID
  title: text("title"), // 标题
  content: jsonb<JSONContent>()("content"), // Tiptap JSONContent
  metadata: jsonb<Record<string, any>>()("metadata"), // Frontmatter
  order: integer("order"), // 排序
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
});
```

---

## 6. 状态管理

### 6.1 核心 Store

**useVibecapeStore** - 全局状态：

```typescript
interface VibecapeState {
  workspace: Workspace | null; // 当前工作区
  tree: DocTreeNode[]; // 文档树
  activeDocId: string | null; // 当前文档 ID
  activeDoc: DocData | null; // 当前文档数据
}
```

**useChatStore** - 对话状态：

```typescript
interface ChatStore {
  chats: Map<string, ChatState>; // 所有对话
  sendMessage(chatId, text, heroId): Promise<void>;
  stop(chatId): void;
}
```

### 6.2 状态持久化

使用 `zustand/middleware` 的 `persist` 进行本地存储：

```typescript
persist(
  (set, get) => ({...}),
  {
    name: "vibecape_store",
    partialize: (state) => ({ activeDocId: state.activeDocId }),
  }
)
```

---

## 7. 开发注意事项

### 7.1 类型安全

- 所有 API 使用 `@common/types/` 和 `@common/schema/` 定义共享类型
- 主进程和渲染进程通过 `window.api` 桥接，类型在 preload 中声明

### 7.2 国际化

- 使用 `react-i18next`
- Hero 使用 `BilingualPrompt { en, zh }` 双语提示词
- UI 文本位于 `renderer/locales/`

### 7.3 主题系统

- CSS 变量定义在 `@styles/theme/` (9 个主题)
- 通过 `.dark` 类切换深色模式
- 核心变量: `--background`, `--foreground`, `--primary`, `--muted` 等

### 7.4 IPC 模式

```typescript
// 调用方式
window.api.chat.stream({ id, thread, prompt, heroId });

// 流式响应通过 IPC channel
ipcRenderer.on(`llm:stream:${requestId}`, handler);
```

---

## 8. 重要文件索引

| 文件                                | 说明           |
| ----------------------------------- | -------------- |
| `main/index.ts`                     | 主进程入口     |
| `main/services/Docs.ts`             | 文档 CRUD 服务 |
| `main/services/Workspace.ts`        | 工作区服务     |
| `main/heroes/Hero.ts`               | Hero 基类      |
| `renderer/App.tsx`                  | React 应用入口 |
| `renderer/hook/useVibecapeStore.ts` | 全局状态       |
| `renderer/hook/chat/useChat.ts`     | 对话 Hook      |
| `common/schema/docs.ts`             | 文档数据模式   |
| `common/types/hero.ts`              | Hero 类型定义  |

---

## 9. 扩展指南

### 添加新 Hero

1. 创建 `heroes/presets/{name}/` 目录
2. 添加 `info.json`, `en.txt`, `zh.txt`, `index.ts`
3. 在 `heroes/presets/index.ts` 注册

### 添加编辑器扩展

1. 在 `editor/extensions/` 创建扩展
2. 在 `DocEditor.tsx` 的 `extensions` 数组中注册

### 添加 Hero 工具

1. 在 `heroes/tools/` 定义工具
2. 在对应 Hero 的 `tools` 配置中引用

---

## 10. 代码协作规范

### 10.1 Git 提交规范

```
<type>(<scope>): <subject>

# type 类型
feat:     新功能
fix:      修复 bug
docs:     文档更新
style:    代码格式 (不影响逻辑)
refactor: 重构 (不是新功能，也不是修复)
perf:     性能优化
test:     测试相关
chore:    构建/工具变更

# 示例
feat(editor): add image paste support
fix(chat): resolve streaming timeout issue
refactor(services): extract Workspace from Settings
```

### 10.2 分支策略

| 分支        | 用途     | 合并目标 |
| ----------- | -------- | -------- |
| `main`      | 稳定版本 | -        |
| `dev`       | 开发分支 | `main`   |
| `feature/*` | 功能开发 | `dev`    |
| `fix/*`     | Bug 修复 | `dev`    |

### 10.3 代码审查要点

- [ ] 类型安全：无 `any`，使用 `@common/types/`
- [ ] 错误处理：try-catch 或 Result 模式
- [ ] IPC 变更：同步更新 preload + handler + 调用方
- [ ] 国际化：UI 文本使用 `t()` 或 `lang()`

---

## 11. 主进程 (Main) 开发规范

### 11.1 Handler 定义模式

```typescript
// handler/docs/VibecapeHandler.ts
import { ipcMain } from "electron";
import { SomeService } from "@main/services/SomeService";

// ✅ 正确：直接转发到 Service
ipcMain.handle("vibecape:getDoc", (_event, id: string) =>
  DocsService.getDoc(id)
);

// ✅ 正确：带参数包装
ipcMain.handle("vibecape:updateDoc", (_event, payload: {
  id: string;
  data: Partial<DocData>;
}) => DocsService.updateDoc(payload.id, payload.data));

// ❌ 错误：在 Handler 中写业务逻辑
ipcMain.handle("vibecape:getDoc", async (_event, id: string) => {
  const db = await getDb();  // 不要这样做
  return db.select()...     // 业务逻辑应在 Service 中
});
```

### 11.2 Service 层设计

```typescript
// services/Docs.ts
export class DocsService {
  // ✅ 静态方法，无状态
  static async getDoc(id: string): Promise<DocData | null> {
    const db = await this.getDb();
    const result = await db.select().from(docs).where(eq(docs.id, id));
    return result[0] ?? null;
  }

  // ✅ 私有辅助方法
  private static async getDb() {
    const workspace = WorkspaceService.getCurrentWorkspace();
    if (!workspace) throw new Error("未打开工作区");
    return getDocsDb(workspace.docs_db_path);
  }
}
```

### 11.3 数据库访问

```typescript
// db/docs.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@common/schema/docs";

// 缓存数据库连接
const dbCache = new Map<string, ReturnType<typeof drizzle>>();

export function getDocsDb(dbPath: string) {
  if (!dbCache.has(dbPath)) {
    const sqlite = new Database(dbPath);
    dbCache.set(dbPath, drizzle(sqlite, { schema }));
  }
  return dbCache.get(dbPath)!;
}
```

### 11.4 错误处理

```typescript
// ✅ Service 中抛出明确错误
static async deleteDoc(id: string): Promise<void> {
  if (!id) throw new Error("文档 ID 不能为空");
  // ...
}

// ✅ Handler 中错误会自动传递到渲染进程
// 渲染进程捕获: try { await window.api.vibecape.deleteDoc(id) } catch (e) {}
```

---

## 12. 渲染进程 (Renderer) 开发规范

### 12.1 调用主进程 API

```typescript
// ✅ 正确：通过 window.api 调用
const doc = await window.api.vibecape.getDoc(id);

// ✅ 正确：在 Hook 中封装
function useDoc(id: string) {
  const [doc, setDoc] = useState<DocData | null>(null);

  useEffect(() => {
    window.api.vibecape.getDoc(id).then(setDoc);
  }, [id]);

  return doc;
}

// ❌ 错误：直接使用 ipcRenderer
import { ipcRenderer } from "electron";
ipcRenderer.invoke(...);  // 不要这样做
```

### 12.2 流式 API 监听

```typescript
// hook/chat/useChat.ts
const channel = `llm:stream:${requestId}`;

// 注册监听
window.electron.ipcRenderer.on(channel, handler);

// ⚠️ 重要：清理监听器
const cleanup = () => {
  window.electron.ipcRenderer.removeAllListeners(channel);
};
```

### 12.3 状态管理模式

```typescript
// ✅ Zustand Store 最佳实践
export const useVibecapeStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      // 状态
      activeDocId: null,

      // 异步 Action
      openDoc: async (id) => {
        set({ loading: true });
        try {
          const doc = await window.api.vibecape.getDoc(id);
          set({ activeDoc: doc, activeDocId: id });
        } catch (error) {
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "vibecape_store",
      // 只持久化必要字段
      partialize: (state) => ({ activeDocId: state.activeDocId }),
    }
  )
);
```

### 12.4 组件开发规范

```typescript
// ✅ 组件文件命名：PascalCase
// DocEditor.tsx, MessageRenderer.tsx

// ✅ Props 接口定义
interface DocEditorProps {
  doc: DocData;
  onChange?: (content: JSONContent) => void;
  onSave?: (content: JSONContent) => void;
}

export const DocEditor: React.FC<DocEditorProps> = ({
  doc,
  onChange,
  onSave,
}) => {
  // 使用解构，明确依赖
};

// ✅ 使用 useCallback 缓存函数
const handleSave = useCallback(() => {
  if (!editor) return;
  onSave?.(editor.getJSON());
}, [editor, onSave]);
```

---

## 13. 前后端通信模式

### 13.1 添加新 IPC API 完整流程

**步骤 1: 定义 Handler (主进程)**

```typescript
// main/handler/docs/VibecapeHandler.ts
ipcMain.handle("vibecape:newFeature", (_event, payload: PayloadType) =>
  SomeService.newFeature(payload)
);
```

**步骤 2: 暴露 API (Preload)**

```typescript
// preload/index.ts
const api = {
  vibecape: {
    // ... 其他 API
    newFeature: (payload: PayloadType) =>
      ipcRenderer.invoke("vibecape:newFeature", payload),
  },
};
```

**步骤 3: 调用 API (渲染进程)**

```typescript
// renderer/hook/useNewFeature.ts
const result = await window.api.vibecape.newFeature(payload);
```

### 13.2 流式响应模式

```typescript
// 主进程发送
webContents.send(`llm:stream:${requestId}`, {
  type: "text-delta", // | "reasoning-delta" | "tool-call" | "end" | "error"
  text: chunk,
});

// 渲染进程接收
window.electron.ipcRenderer.on(`llm:stream:${requestId}`, handler);
```

### 13.3 事件通知模式

```typescript
// 主进程通知
BrowserWindow.getFocusedWindow()?.webContents.send("chat:thread-updated", {
  threadId,
  title,
});

// 渲染进程订阅 (Preload)
onThreadUpdated: (callback) => {
  const handler = (_event, data) => callback(data);
  ipcRenderer.on("chat:thread-updated", handler);
  return () => ipcRenderer.removeListener("chat:thread-updated", handler);
},
```

---

## 14. 常见陷阱与最佳实践

### 14.1 避免的反模式

| ❌ 反模式                      | ✅ 正确做法            |
| ------------------------------ | ---------------------- |
| Handler 中写业务逻辑           | 转发到 Service         |
| 渲染进程直接 import 主进程代码 | 通过 `window.api` 调用 |
| 在组件中直接操作数据库         | 通过 IPC + Service     |
| 忽略 IPC 返回值类型            | 定义明确的 TS 类型     |
| 忘记清理 IPC 监听器            | 在 cleanup 中移除      |

### 14.2 性能注意事项

```typescript
// ✅ 批量操作而非循环单个调用
await DocsService.bulkUpdate(docs); // 好
for (const doc of docs) {
  await DocsService.update(doc);
} // 差

// ✅ 使用 selector 避免不必要渲染
const activeDocId = useVibecapeStore((state) => state.activeDocId); // 好
const store = useVibecapeStore(); // 差 - 任何状态变化都触发渲染

// ✅ 大数据使用分页
await window.api.chat.list({ limit: 20, offset: page * 20 });
```

### 14.3 类型安全检查清单

- [ ] `@common/types/` 中定义共享类型
- [ ] `@common/schema/` 中定义数据库模式
- [ ] Handler 参数使用明确类型
- [ ] Preload API 方法签名与 Handler 一致
- [ ] Store 状态有完整类型定义
