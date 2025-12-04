# Vibecape 数据存储架构

本文档描述 Vibecape 应用的数据存储方式，分为**用户设置**和**项目设置**两部分。

---

## 1. 用户设置 (User Settings)

用户设置是全局的、跨项目的配置，存储在用户主目录下的 `.vibecape` 文件夹中。

### 存储位置

```
~/.vibecape/                    # 用户主目录下的 .vibecape 文件夹
├── app.db                      # 应用设置数据库 (SQLite)
└── chat.db                     # 聊天记录数据库 (SQLite)
```

### 数据库结构

#### `app.db` - 应用设置数据库

| 表名 | 说明 |
|------|------|
| `settings` | 应用设置 (主题、语言、代理、OSS 配置等) |
| `providers` | AI 服务商配置 (API Key、Base URL 等) |
| `models` | AI 模型配置 |

**`settings` 表数据结构 (`SettingsData`):**

```typescript
{
  ui: {
    theme: string;           // 主题
    mode: string;            // 明暗模式 (light/dark)
    language: string;        // 界面语言
    promptLanguage: string;  // 提示词语言
    showChapterList: boolean;
  };
  model: {
    primary: string;         // 主模型 ID
    fast: string;            // 快速模型 ID
    image: string;           // 图像模型 ID
    video: string;           // 视频模型 ID
    voice: string;           // 语音模型 ID
  };
  general: {
    proxy: {
      enabled: boolean;
      url: string;
    };
    oss: {
      enabled: boolean;
      provider: "aliyun" | "qiniu" | "tencent" | "s3";
      region: string;
      bucket: string;
      accessKeyId: string;
      accessKeySecret: string;
      endpoint: string;
      customDomain: string;
    };
    docsRoot: string;              // (已废弃)
    vibecapeRoot: string;          // 当前打开的工作区路径
    recentWorkspaces: Array<{      // 最近打开的工作区历史
      path: string;
      name: string;
      lastOpenedAt: number;
    }>;
  };
}
```

#### `chat.db` - 聊天数据库

存储 AI 对话历史记录，与具体项目无关。

---

## 2. 项目设置 (Project/Workspace Settings)

项目设置是针对单个文档项目的配置，存储在项目目录内的 `vibecape` 文件夹中。

### 存储位置

```
/path/to/your-docs-project/     # 用户选择的文档目录 (root)
├── vibecape/                   # 项目工作区目录 (vibecapePath)
│   ├── docs.db                 # 文档数据库 (SQLite)
│   ├── configs.json            # 工作区配置文件
│   └── .gitignore              # 忽略数据库文件
├── getting-started.mdx         # 文档文件
├── guides/                     # 文档子目录
│   └── ...
└── ...
```

> **注意**: 旧版本使用 `.vibecape` (带点号) 作为目录名，新版本会自动迁移到 `vibecape`。

### 数据库结构

#### `docs.db` - 文档数据库

| 表名 | 说明 |
|------|------|
| `docs` | 文档内容 (Tiptap JSONContent 格式) |
| `workspace_settings` | 工作区级别设置 |

**`docs` 表结构:**

```typescript
{
  id: string;                    // 唯一 ID
  parent_id: string | null;      // 父节点 ID (null 为根节点)
  title: string;                 // 文档标题
  content: JSONContent;          // Tiptap 编辑器内容
  metadata: Record<string, any>; // Frontmatter 元数据
  order: number;                 // 同级排序权重
  created_at: number;            // 创建时间戳
  updated_at: number;            // 更新时间戳
}
```

### 配置文件

#### `configs.json` - 工作区配置

```typescript
{
  fumadocs: {
    docsDir: string;             // Fumadocs 文档目录
    assetsDir: string;           // 资源目录
  };
  publishing: {
    assetUploadPriority: "oss-first" | "local-first";  // 资源上传优先级
  };
}
```

### `.gitignore` 内容

自动生成，忽略数据库文件：

```
*.db
*.db-journal
*.db-wal
*.db-shm
```

---

## 3. 完整目录结构示例

### 用户目录 (`~/.vibecape`)

```
~/.vibecape/
├── app.db                      # 应用设置 (providers, models, settings)
└── chat.db                     # 聊天记录
```

### 项目目录示例

```
/Users/username/Documents/my-docs/
├── vibecape/                   # Vibecape 工作区
│   ├── docs.db                 # 文档数据库
│   ├── configs.json            # 工作区配置
│   └── .gitignore              # Git 忽略规则
├── index.mdx                   # 首页文档
├── getting-started.mdx         # 入门文档
├── guides/                     # 指南目录
│   ├── index.mdx               # 指南首页
│   ├── installation.mdx        # 安装指南
│   └── configuration.mdx       # 配置指南
├── api/                        # API 文档目录
│   ├── index.mdx
│   └── ...
└── ...
```

---

## 4. 数据流向

```
┌─────────────────────────────────────────────────────────────┐
│                     用户设置 (全局)                          │
│                   ~/.vibecape/app.db                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  settings   │  │  providers  │  │       models        │  │
│  │ (UI/代理等) │  │ (API配置)   │  │    (模型配置)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 引用 vibecapeRoot
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   项目设置 (每个项目独立)                    │
│              /path/to/project/vibecape/                     │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │      docs.db        │  │       configs.json          │  │
│  │   (文档内容/树)     │  │    (发布/Fumadocs配置)      │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 相关代码文件

| 文件 | 说明 |
|------|------|
| `src/main/db/app.ts` | 用户设置数据库初始化 |
| `src/main/db/chat.ts` | 聊天数据库初始化 |
| `src/main/db/docs.ts` | 项目文档数据库管理 |
| `src/main/services/Settings.ts` | 设置服务 (CRUD) |
| `src/main/services/VibecapeDocs.ts` | 文档服务 (工作区管理) |
| `src/common/schema/app.ts` | 用户设置数据类型定义 |
| `src/common/schema/docs.ts` | 项目文档数据类型定义 |
| `src/common/config/settings.ts` | 设置默认值 |
