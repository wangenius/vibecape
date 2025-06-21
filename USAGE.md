# Vibe CLI 使用指南

## 🚀 快速开始

### 1. 安装 Vibe CLI

```bash
# 全局安装（推荐）
npm install -g vibeta

# 或者在项目中本地使用
npx vibeta
```

### 2. 创建新项目

```bash
# 交互式创建项目
vibe create

# 直接指定项目名称和模板
vibe create my-saas-app --template=ai-saas --typescript --tailwind
```

### 3. 添加功能集成

```bash
# 添加用户认证
vibe install auth --provider=clerk

# 添加支付系统
vibe install payments --provider=stripe

# 添加国际化
vibe install i18n --provider=next-intl
```

## 📋 所有命令

### `vibe create`

创建新的 SaaS 项目

**用法：**
```bash
vibe create [项目名称] [选项]
```

**选项：**
- `-t, --template <template>` - 指定项目模板
- `--typescript` - 启用 TypeScript
- `--tailwind` - 启用 Tailwind CSS
- `--eslint` - 启用 ESLint

**示例：**
```bash
# 交互式创建
vibe create

# 指定所有参数
vibe create my-app --template=basic-saas --typescript --tailwind --eslint
```

### `vibe install`

安装和集成中间件服务

**用法：**
```bash
vibe install [集成类型] [选项]
```

**支持的集成类型：**
- `auth` - 用户认证系统
- `payments` - 支付系统
- `i18n` - 国际化支持
- `database` - 数据库配置
- `email` - 邮件服务
- `storage` - 文件存储
- `analytics` - 分析监控

**选项：**
- `-p, --provider <provider>` - 指定服务提供商
- `--config <config>` - 额外配置参数

**示例：**
```bash
# 交互式选择
vibe install auth

# 指定提供商
vibe install auth --provider=clerk
vibe install payments --provider=stripe
vibe install i18n --provider=next-intl
```

### `vibe config`

管理项目配置

**子命令：**
```bash
# 显示当前配置
vibe config list

# 设置配置项
vibe config set --key=default-provider --value=vercel

# 获取配置项
vibe config get project.name
```

### `vibe health`

检查项目健康状态

```bash
vibe health
```

检查项目：
- Node.js 版本兼容性
- package.json 文件存在
- Vibe 配置文件
- Git 仓库状态
- 依赖安装情况

### `vibe templates`

管理项目模板

```bash
# 显示可用模板
vibe templates list
```

**可用模板：**
- `ai-saas` - AI驱动的SaaS应用模板
- `basic-saas` - 基础SaaS应用模板
- `e-commerce` - 电商应用模板

### `vibe update`

更新已安装的中间件

```bash
# 更新所有集成
vibe update --all

# 更新特定集成
vibe update auth
```

### `vibe revise`

修正和优化项目结构

```bash
vibe revise
```

## 🔧 支持的服务提供商

### 认证服务 (auth)
- **Clerk** - 现代化的用户认证服务
- **NextAuth** - Next.js 官方认证解决方案
- **Supabase Auth** - 开源认证服务

### 支付系统 (payments)
- **Stripe** - 全球领先的支付平台
- **Paddle** - 税务处理和全球合规
- **LemonSqueezy** - 独立开发者友好

### 国际化 (i18n)
- **next-intl** - Next.js 国际化解决方案
- **react-i18next** - 成熟的国际化方案

### 数据库 (database)
- **Supabase** - PostgreSQL + 实时功能
- **PlanetScale** - MySQL + 分支管理
- **Neon** - 无服务器 PostgreSQL

## 📁 项目结构

使用 Vibe CLI 创建的项目遵循以下结构：

```
my-saas-project/
├── client/                  # 前端项目
│   ├── components/          # React 组件
│   ├── pages/              # 页面文件
│   ├── hooks/              # React Hooks
│   └── services/           # 前端服务
├── server/                 # 后端项目
│   ├── router/             # API 路由
│   ├── service/            # 业务逻辑
│   └── database/           # 数据库配置
├── types/                  # 类型定义
├── vibe.config.ts        # Vibe CLI 配置
├── package.json
└── README.md
```

## 🛠️ 开发工作流

### 1. 创建项目
```bash
vibe create my-saas --template=ai-saas
cd my-saas
```

### 2. 安装依赖
```bash
npm install
```

### 3. 添加功能
```bash
# 添加用户认证
vibe install auth --provider=clerk

# 添加支付系统
vibe install payments --provider=stripe

# 添加国际化
vibe install i18n --locales=en,zh,ja
```

### 4. 配置环境变量
根据集成的服务，在 `.env.local` 中配置相应的环境变量。

### 5. 启动开发
```bash
npm run dev
```

### 6. 健康检查
```bash
vibe health
```

## 🔍 故障排除

### 常见问题

**Q: 命令找不到？**
```bash
# 确保全局安装了 CLI
npm install -g vibe-cli

# 或者使用 npx
npx vibe-cli --version
```

**Q: 模块找不到？**
```bash
# 重新安装依赖
npm install

# 清理缓存
npm cache clean --force
```

**Q: TypeScript 错误？**
```bash
# 检查 TypeScript 配置
vibe health

# 重新构建
npm run build
```

## 📚 更多资源

- [GitHub 仓库](https://github.com/vibe-cli/vibe)
- [官方文档](https://docs.vibe-cli.com)
- [社区讨论](https://github.com/vibe-cli/discussions)
- [问题反馈](https://github.com/vibe-cli/issues)

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

```bash
# 克隆仓库
git clone https://github.com/vibe-cli/vibe.git

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建项目
npm run build

# 运行测试
npm test
``` 