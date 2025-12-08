# Vibecape Package 项目结构

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Electron + React 18 |
| 语言 | TypeScript 5.x |
| 编辑器 | Tiptap (ProseMirror) |
| 数据库 | SQLite + Drizzle ORM |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS 4 |
| AI SDK | Vercel AI SDK |
| 构建工具 | electron-vite + Vite 7 |

---

## 目录结构总览

```
package/
├── src/
│   ├── common/          # 共享代码（主进程 + 渲染进程）
│   ├── main/            # Electron 主进程
│   ├── preload/         # 预加载脚本
│   └── renderer/        # React 渲染进程
├── resources/           # 静态资源（图标等）
├── out/                 # 构建输出
└── 配置文件
```

---

## 1. Common 层 (`src/common/`)

共享于主进程和渲染进程的代码。

```
common/
├── api/                 # API 类型定义
│   ├── app.ts          # 应用 API
│   ├── chat.ts         # 聊天 API
│   ├── index.ts        # 导出
│   └── vibecape.ts     # 工作区 API
│
├── lib/                 # 通用工具库
│   ├── content-converter.ts   # Markdown ↔ JSONContent 转换器
│   ├── generator.ts           # ID 生成器
│   └── shape.ts               # 对象路径操作工具
│
├── schema/              # 数据库 Schema (Drizzle ORM)
│   ├── app.ts          # providers, models 表
│   ├── chat.ts         # chat_threads, chat_messages 表
│   ├── config.ts       # 应用配置类型
│   ├── custom.type.ts  # 自定义 Drizzle 类型
│   ├── docs.ts         # docs 表
│   ├── workspace.ts    # 工作区配置
│   └── workspace_config.ts
│
└── types/               # TypeScript 类型定义
    ├── agent.ts        # Agent 相关类型
    ├── content.ts      # 内容类型
    ├── docs.ts         # 文档类型
    ├── hero.ts         # Hero 类型（双语 Prompt 等）
    ├── llm.ts          # LLM 配置类型
    ├── lore-config.ts  # Lore 配置
    └── message.ts      # 消息部件类型
```

---

## 2. Main 进程 (`src/main/`)

Electron 主进程，处理系统 API、数据库、AI 调用。

```
main/
├── index.ts             # 入口：窗口创建、协议注册、服务初始化
│
├── db/                  # 数据库层
│   ├── app.ts          # app.db 初始化 (providers/models)
│   ├── chat.ts         # chat.db 初始化 (threads/messages)
│   ├── client.ts       # 数据库连接管理
│   ├── docs.ts         # docs.db 动态连接（按工作区）
│   └── ensure-schema.ts # 运行时 Schema 创建
│
├── handler/             # IPC Handler（副作用注册）
│   ├── app/
│   │   ├── ModelHandler.ts     # 模型 CRUD
│   │   ├── ProviderHandler.ts  # Provider CRUD
│   │   └── SettingsHandler.ts  # 设置读写
│   ├── chat/
│   │   └── ChatHandler.ts      # 聊天流、历史
│   └── docs/
│       ├── DocsAIHandler.ts    # 文档 AI 生成
│       ├── ImageHandler.ts     # 图片上传
│       └── VibecapeHandler.ts  # 工作区/文档 CRUD
│
├── heroes/              # AI Hero 系统
│   ├── Hero.ts         # Hero 基类
│   ├── HeroesManager.ts # Hero 注册管理
│   ├── index.ts        # 导出
│   ├── presets/        # 预设 Hero
│   │   ├── iris/       # 写作助手
│   │   ├── luca/       # 代码专家
│   │   ├── max/        # 多功能助手
│   │   ├── muse/       # 创意写作
│   │   ├── nova/       # 新手向导
│   │   └── sage/       # 知识专家
│   ├── tools/          # AI 工具集
│   │   ├── common.ts   # 通用工具
│   │   ├── docContent.ts # 文档内容操作工具
│   │   ├── docs.ts     # 文档管理工具
│   │   └── document.ts # 编辑器操作工具
│   └── types/
│
├── services/            # 业务服务层
│   ├── Chat.ts         # 聊天记录服务
│   ├── ChatStream.ts   # 流式对话服务 ⭐
│   ├── Docs.ts         # 文档 CRUD 服务
│   ├── MCPManager.ts   # MCP 协议管理
│   ├── Model.ts        # 模型配置服务
│   ├── Provider.ts     # Provider 配置服务
│   ├── Settings.ts     # 应用设置服务
│   ├── UserData.ts     # 用户数据路径管理
│   └── Workspace.ts    # 工作区管理服务
│
└── utils/
    ├── providers.ts    # AI Provider 实例化
    └── proxy.ts        # 代理配置
```

### 服务层架构

```
┌─────────────────────────────────────────────────────────────┐
│                     IPC Handlers                            │
│  (SettingsHandler, ModelHandler, ChatHandler, ...)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Services 层                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Settings │ │  Model   │ │ Provider │ │ ChatStream   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │   Docs   │ │Workspace │ │   Chat   │ │  MCPManager  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database 层                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────────────────┐  │
│  │  app.db    │ │  chat.db   │ │ {workspace}/docs.db    │  │
│  │ (providers,│ │ (threads,  │ │ (docs)                 │  │
│  │  models)   │ │  messages) │ │                        │  │
│  └────────────┘ └────────────┘ └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Preload 层 (`src/preload/`)

安全桥接主进程和渲染进程。

```
preload/
└── index.ts            # 暴露 window.api 对象
    ├── api.docs        # 文档操作
    ├── api.app         # 应用配置 (provider/model/settings/mcp)
    ├── api.chat        # 聊天操作
    └── api.vibecape    # 工作区操作
```

---

## 4. Renderer 渲染进程 (`src/renderer/`)

React 应用，负责 UI 渲染。

```
renderer/
├── App.tsx              # 根组件
├── main.tsx             # 入口
├── index.html           # HTML 模板
│
├── @styles/             # 样式文件
│   ├── theme/          # 主题变量
│   ├── tokens/         # 设计令牌
│   ├── base.css        # 基础样式
│   ├── editor.css      # 编辑器样式
│   └── main.css        # 主样式入口
│
├── components/          # 组件库
│   ├── ai/             # AI 相关组件 (21个)
│   ├── chat/           # 聊天组件
│   ├── custom/         # 自定义业务组件
│   ├── docs/           # 文档组件
│   ├── editor/         # 编辑器组件 ⭐
│   ├── settings/       # 设置组件
│   └── ui/             # 基础 UI 组件 (Radix)
│
├── hooks/               # React Hooks
│   ├── app/            # 应用级 hooks
│   ├── chat/           # 聊天相关 hooks
│   ├── editor/         # 编辑器 hooks
│   ├── model/          # 模型配置 hooks
│   ├── shortcuts/      # 快捷键 hooks
│   ├── stores/         # Zustand stores
│   └── util/           # 工具 hooks
│
├── layouts/             # 布局组件
│   ├── Header.tsx      # 顶部标题栏
│   ├── Baybar.tsx      # 右侧边栏（AI 面板）
│   ├── sidebar/        # 左侧边栏
│   └── mainview/       # 主视图区域
│
└── lib/                 # 工具库
    ├── events/         # 事件系统
    ├── locales/        # 国际化
    ├── tools.ts        # 工具函数
    └── utils.ts        # 通用工具
```

### 组件层级架构

```
App.tsx
├── Header                    # 顶部标题栏 (拖拽区域、窗口控制)
├── Sidebar                   # 左侧边栏
│   ├── SidebarHeader        # 工作区选择
│   ├── ViewModeSwitch       # 视图切换
│   ├── DocTree              # 文档树
│   └── SidebarEmptyState    # 空状态
├── MainView                  # 主视图
│   ├── DocWorkspace         # 文档编辑区
│   │   ├── TitleInput       # 标题输入
│   │   └── DocEditor        # Tiptap 编辑器 ⭐
│   └── EmptyDocState        # 空文档状态
├── Baybar                    # 右侧 AI 面板
│   └── ChatPanel            # 聊天面板
├── CommandPalette           # 命令面板 (Cmd+K)
└── DocSearchPalette         # 文档搜索 (Cmd+P)
```

---

## 5. 编辑器模块 (`components/editor/`)

基于 Tiptap 的富文本编辑器，是项目核心。

```
editor/
├── DocEditor.tsx        # 编辑器主组件
├── TitleInput.tsx       # 标题输入框
├── TiptapProse.ts       # Prose 样式配置
├── TiptapTools.tsx      # 工具栏
│
├── extensions/          # Tiptap 扩展 ⭐⭐⭐
│   │
│   │  # AI 功能扩展
│   ├── AIDiffMark.ts       # AI Diff 标记（高亮变更）
│   ├── AIDiffNode.tsx      # AI Diff 节点（块级变更）
│   ├── AIRewriteNode.tsx   # AI 重写节点（行内编辑）⭐
│   ├── PredictNode.tsx     # AI 预测补全
│   │
│   │  # 富文本扩展
│   ├── Admonition.tsx      # 提示框组件
│   ├── AdmonitionExtension.tsx
│   ├── Blockquote.ts       # 引用块
│   ├── CodeBlockNode.tsx   # 代码块（Shiki 高亮）
│   ├── ImageNode.tsx       # 图片节点
│   ├── InlineCode.ts       # 行内代码
│   ├── LinkNode.tsx        # 链接节点
│   ├── TableExtension.ts   # 表格扩展
│   │
│   │  # 交互扩展
│   ├── CustomKeyboardExtension.ts  # 自定义快捷键
│   ├── MarkdownPasteExtension.ts   # Markdown 粘贴
│   ├── Mention.tsx         # @提及功能
│   ├── MentionNode.tsx     # 提及节点
│   ├── MentionExtension.ts
│   ├── MentionCommand.ts
│   └── SlashCommand.ts     # 斜杠命令
│
├── menus/               # 编辑器菜单
│   ├── BubbleMenu.tsx   # 选中气泡菜单
│   ├── FloatingMenu.tsx # 浮动菜单
│   └── SlashMenu.tsx    # 斜杠菜单
│
└── popover/             # 弹出层
    └── LinkPopover.tsx  # 链接编辑
```

---

## 6. 状态管理 (`hooks/stores/`)

使用 Zustand 管理全局状态。

```
stores/
├── index.ts              # 导出 + bootstrap 初始化
├── useWorkspaceStore.ts  # 工作区状态
├── useDocumentStore.ts   # 文档状态（树、当前文档）
├── useUIStore.ts         # UI 状态（loading、error）
└── useMentionHistoryStore.ts  # @提及历史
```

### 状态流转

```
bootstrap() 启动流程
      │
      ├── initModels() / initProviders()  # 加载 AI 配置
      │
      ├── loadWorkspaceList()              # 加载工作区列表
      │
      ├── restoreLastWorkspace()           # 恢复上次工作区
      │         │
      │         └── refreshTree()          # 加载文档树
      │                   │
      │                   └── restoreDoc() # 恢复上次文档
      │
      └── onDocsChanged()                  # 监听文档变更
```

---

## 7. AI 组件 (`components/ai/`)

AI 交互相关的 UI 组件。

```
ai/
├── StreamdownMessage.tsx  # 流式消息渲染
├── conversation.tsx       # 对话视图
├── response.tsx           # AI 响应
├── reasoning.tsx          # 推理过程展示
├── chain-of-thought.tsx   # 思维链
│
├── tool.tsx              # 工具调用展示
├── sources.tsx           # 来源引用
├── task.tsx              # 任务状态
│
├── code-block.tsx        # 代码块
├── image.tsx             # 图片
├── artifact.tsx          # 工件（代码/文档）
│
├── open-in-chat.tsx      # 在聊天中打开
├── web-preview.tsx       # 网页预览
│
├── branch.tsx            # 分支对话
├── edge.tsx              # 连接线
├── connection.tsx        # 连接状态
│
├── actions.tsx           # 操作按钮
├── controls.tsx          # 控制组件
├── panel.tsx             # 面板
├── toolbar.tsx           # 工具栏
└── loader.tsx            # 加载状态
```

---

## 8. 数据流架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Renderer 进程                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   Zustand   │◄───│   Hooks     │◄───│    Components       │ │
│  │   Stores    │    │             │    │                     │ │
│  └──────┬──────┘    └─────────────┘    └─────────────────────┘ │
│         │                                                       │
└─────────┼───────────────────────────────────────────────────────┘
          │ window.api (IPC)
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Preload 层                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  contextBridge.exposeInMainWorld('api', { ... })         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────┬───────────────────────────────────────────────────────┘
          │ ipcRenderer.invoke()
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Main 进程                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   Handlers  │───►│  Services   │───►│     Database        │ │
│  │  (IPC)      │    │             │    │  (SQLite/Drizzle)   │ │
│  └─────────────┘    └──────┬──────┘    └─────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│                     ┌─────────────┐                             │
│                     │  AI SDK     │                             │
│                     │ (OpenAI等)  │                             │
│                     └─────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. 文件存储结构

```
~/vibecape/                      # 用户数据目录
├── config.json                  # 应用配置
├── app.db                       # AI 配置 (providers, models)
├── chat.db                      # 全局聊天记录
└── mcp.json                     # MCP 配置

{docs_root}/                     # 文档根目录（用户选择）
└── {workspace_id}/              # 工作区目录
    ├── config.json              # 工作区配置
    ├── docs.db                  # 文档数据库
    ├── llm.txt                  # AI 上下文提示
    └── assets/                  # 图片资源
```

---

## 10. 快捷键系统 (`hooks/shortcuts/`)

```
shortcuts/
├── useChatInputFocus.ts    # Cmd+J 聚焦聊天输入
├── useDocEditorFocus.ts    # Esc 返回编辑器
├── usePalette.ts           # Cmd+K 命令面板, Cmd+P 文档搜索
├── useSettingsToggle.ts    # Cmd+, 设置面板
├── useSidebarToggle.ts     # Cmd+\ 切换侧边栏
└── ...
```

### 快捷键映射

| 快捷键 | 功能 |
|--------|------|
| `Cmd+J` | 聚焦 AI 输入框 |
| `Cmd+K` | 打开命令面板 |
| `Cmd+P` | 打开文档搜索 |
| `Cmd+,` | 打开设置 |
| `Cmd+\` | 切换侧边栏 |
| `Cmd+W` | 扩展选区 |
| `Shift+Cmd+W` | 收缩选区 |
| `Cmd+Enter` | 确认 |
| `Shift+Enter` | 重新生成 |

---

## 模块依赖关系

```
                    common/
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       main/      preload/    renderer/
          │           │           │
          └───────────┴───────────┘
                      │
                  IPC 通信
```

---

*文档更新时间: 2024*
