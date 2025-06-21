# 项目模板

Vibe CLI 提供了多种精心设计的项目模板，帮助你快速启动不同类型的 SaaS 应用。每个模板都包含了最佳实践、现代化的技术栈和完整的项目结构。

## 🚀 快速开始

```bash
# 查看可用模板
vibe templates list

# 使用特定模板创建项目
vibe create my-app --template=ai-saas
```

## 📦 可用模板

### 🤖 [AI SaaS 模板](/templates/ai-saas)

专为 AI 驱动的 SaaS 应用设计，集成了 AI 服务、用户认证、支付系统等功能。

**适用场景：**
- AI 写作工具
- 图片生成应用
- 聊天机器人
- 数据分析平台
- 智能推荐系统

**内置功能：**
- 🤖 OpenAI/Anthropic API 集成
- 🔐 用户认证 (Clerk)
- 💳 订阅付费 (Stripe)
- 📊 使用量统计
- 🎨 现代化 UI (Tailwind CSS)

```bash
vibe create my-ai-app --template=ai-saas
```

### 🏢 [基础 SaaS 模板](/templates/basic-saas)

通用的 SaaS 应用模板，包含了大多数 SaaS 应用需要的核心功能。

**适用场景：**
- 项目管理工具
- CRM 系统
- 团队协作平台
- 数据仪表板
- 内容管理系统

**内置功能：**
- 👥 用户管理系统
- 🏢 多租户支持
- 📊 仪表板界面
- 🔔 通知系统
- 📱 响应式设计

```bash
vibe create my-saas --template=basic-saas
```

### 🛒 [电商模板](/templates/e-commerce)

完整的电商解决方案，包含商品管理、订单处理、支付集成等功能。

**适用场景：**
- 在线商店
- 数字产品销售
- 订阅盒子服务
- B2B 电商平台
- 市场平台

**内置功能：**
- 🛍️ 商品目录管理
- 🛒 购物车系统
- 💳 多种支付方式
- 📦 订单管理
- 👤 客户账户系统

```bash
vibe create my-store --template=e-commerce
```

## 🏗️ 模板架构

所有模板都遵循统一的项目架构，确保代码的可维护性和可扩展性：

```
project-name/
├── client/                  # 前端应用
│   ├── components/          # React 组件
│   │   ├── ui/             # 基础 UI 组件
│   │   ├── layout/         # 布局组件
│   │   └── features/       # 功能组件
│   ├── pages/              # 页面文件
│   ├── hooks/              # 自定义 Hooks
│   ├── services/           # API 服务
│   ├── utils/              # 工具函数
│   └── styles/             # 样式文件
├── server/                 # 后端应用
│   ├── api/                # API 路由
│   ├── middleware/         # 中间件
│   ├── services/           # 业务逻辑
│   ├── models/             # 数据模型
│   └── utils/              # 工具函数
├── types/                  # 类型定义
├── docs/                   # 项目文档
├── tests/                  # 测试文件
└── config/                 # 配置文件
```

## 🛠️ 技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14+ | React 框架 |
| React | 18+ | UI 库 |
| TypeScript | 5+ | 类型安全 |
| Tailwind CSS | 3+ | 样式框架 |
| shadcn/ui | 最新 | UI 组件库 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行时 |
| Next.js API | 14+ | API 路由 |
| Prisma | 5+ | ORM |
| PostgreSQL | 15+ | 数据库 |
| Redis | 7+ | 缓存 |

### 开发工具

| 工具 | 用途 |
|------|------|
| ESLint | 代码检查 |
| Prettier | 代码格式化 |
| Husky | Git 钩子 |
| Jest | 单元测试 |
| Playwright | E2E 测试 |

## 🎨 设计系统

所有模板都包含了完整的设计系统：

### 颜色主题

```css
:root {
  /* 主色调 */
  --primary: 220 14% 96%;
  --primary-foreground: 220 9% 46%;
  
  /* 次要色调 */
  --secondary: 220 14% 96%;
  --secondary-foreground: 220 9% 46%;
  
  /* 强调色 */
  --accent: 220 14% 96%;
  --accent-foreground: 220 9% 46%;
  
  /* 状态色 */
  --destructive: 0 62% 30%;
  --destructive-foreground: 0 85% 97%;
}
```

### 组件库

- **Button** - 按钮组件，支持多种变体
- **Input** - 输入框组件，包含验证状态
- **Card** - 卡片组件，用于内容展示
- **Dialog** - 对话框组件，支持模态和非模态
- **Table** - 表格组件，支持排序和分页
- **Form** - 表单组件，集成验证逻辑

### 布局系统

- **Header** - 顶部导航栏
- **Sidebar** - 侧边栏导航
- **Footer** - 页面底部
- **Container** - 内容容器
- **Grid** - 网格布局系统

## 🔧 自定义模板

你也可以创建自己的模板：

### 1. 创建模板目录

```bash
mkdir -p ~/.vibe/templates/my-template
cd ~/.vibe/templates/my-template
```

### 2. 添加模板文件

```bash
# 创建模板结构
mkdir -p client server types
touch template.json README.md
```

### 3. 配置模板元信息

```json
// template.json
{
  "name": "my-template",
  "displayName": "My Custom Template",
  "description": "我的自定义模板",
  "version": "1.0.0",
  "author": "Your Name",
  "tags": ["custom", "saas"],
  "features": [
    "Custom feature 1",
    "Custom feature 2"
  ],
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0"
  }
}
```

### 4. 使用自定义模板

```bash
vibe create my-project --template=my-template
```

## 📚 模板开发指南

### 变量替换

模板支持变量替换，使用 Handlebars 语法：

```json
{
  "name": "{{projectName}}",
  "description": "{{projectDescription}}"
}
```

```tsx
// components/Header.tsx
export function Header() {
  return (
    <header>
      <h1>{{projectName}}</h1>
    </header>
  )
}
```

### 条件渲染

```handlebars
{{#if typescript}}
// TypeScript 相关代码
{{/if}}

{{#if tailwind}}
import './globals.css'
{{/if}}
```

### 循环渲染

```handlebars
{{#each integrations}}
import { {{name}}Provider } from '@{{name}}/react'
{{/each}}
```

## 🚀 最佳实践

### 1. 项目结构

- 保持清晰的目录结构
- 按功能而非技术分组
- 使用有意义的文件命名
- 添加适当的文档说明

### 2. 代码质量

- 使用 TypeScript 确保类型安全
- 遵循一致的代码风格
- 添加必要的注释
- 编写单元测试

### 3. 性能优化

- 使用代码分割减少包大小
- 实施图片优化
- 启用缓存策略
- 监控性能指标

### 4. 安全性

- 验证用户输入
- 使用环境变量存储敏感信息
- 实施 CSRF 保护
- 定期更新依赖

## 🆘 故障排除

### 模板下载失败

```bash
# 清理缓存
vibe cache clean

# 重新下载模板
vibe create my-app --template=ai-saas --force
```

### 依赖安装错误

```bash
# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 类型错误

```bash
# 重新生成类型定义
npm run type-check
```

## 🚀 下一步

选择合适的模板开始你的项目：

- [AI SaaS 模板](/templates/ai-saas) - 构建 AI 驱动的应用
- [基础 SaaS 模板](/templates/basic-saas) - 通用 SaaS 应用
- [电商模板](/templates/e-commerce) - 电商解决方案

创建项目后，你可以：

- [添加集成](/integrations/) - 集成第三方服务
- [配置部署](/guide/deployment) - 部署到生产环境
- [自定义样式](/guide/styling) - 个性化界面设计

---

**选择合适的模板，让你的 SaaS 项目赢在起跑线！** 🚀 