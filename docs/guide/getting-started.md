# 快速开始

欢迎使用 Vibe CLI！这个指南将带你在 5 分钟内创建你的第一个 SaaS 项目。

## 📋 前置要求

在开始之前，请确保你的系统已安装：

- **Node.js** 16.0 或更高版本
- **npm** 或 **yarn** 或 **pnpm**
- **Git** (可选，用于版本控制)

::: tip 检查版本
```bash
node --version  # 应该显示 v16.0.0 或更高
npm --version   # 应该显示 8.0.0 或更高
```
:::

## 🚀 安装 Vibe CLI

### 全局安装（推荐）

```bash
npm install -g vibe-cli
```

### 验证安装

```bash
vibe --version
vibe --help
```

你应该看到类似这样的输出：

```
🚀 Vibe CLI - SaaS 应用搭建神器
让每个有想法的人都能在半小时内搭建出自己的在线服务产品

Usage: vibe [options] [command]
```

## 🎯 创建你的第一个项目

### 1. 交互式创建

最简单的方式是使用交互式命令：

```bash
vibe create
```

系统会询问你以下问题：

- **项目名称**: 输入你的项目名称（如：my-awesome-saas）
- **选择模板**: 选择一个项目模板
- **包管理器**: 选择 npm、yarn 或 pnpm
- **启用 TypeScript**: 推荐选择 Yes
- **启用 Tailwind CSS**: 推荐选择 Yes
- **启用 ESLint**: 推荐选择 Yes

### 2. 命令行直接创建

如果你已经知道要什么，可以直接指定参数：

```bash
vibe create my-saas-app \
  --template=ai-saas \
  --typescript \
  --tailwind \
  --eslint
```

### 3. 等待项目创建

创建过程包括：
- ✅ 复制模板文件
- ✅ 安装依赖包
- ✅ 配置项目设置
- ✅ 生成配置文件

## 📁 项目结构

创建完成后，你会看到这样的项目结构：

```
my-saas-app/
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
├── vibe.config.json        # Vibe CLI 配置
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 启动项目

### 1. 进入项目目录

```bash
cd my-saas-app
```

### 2. 安装依赖（如果还没有安装）

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 打开浏览器

访问 [http://localhost:3000](http://localhost:3000) 查看你的项目！

## ⚡ 添加功能

现在你有了一个基础项目，让我们添加一些常用功能：

### 添加用户认证

```bash
vibe install auth --provider=clerk
```

这会：
- 安装 Clerk 认证服务
- 配置认证组件
- 生成登录/注册页面
- 设置环境变量模板

### 添加支付系统

```bash
vibe install payments --provider=stripe
```

这会：
- 安装 Stripe 支付集成
- 配置支付组件
- 生成订阅管理页面
- 设置 Webhook 处理

### 添加国际化

```bash
vibe install i18n --provider=next-intl
```

这会：
- 配置多语言支持
- 生成语言文件结构
- 设置语言切换组件

## 🔧 配置环境变量

根据你添加的集成，需要配置相应的环境变量：

### 1. 复制环境变量模板

```bash
cp .env.example .env.local
```

### 2. 填写必要的 API 密钥

```bash
# .env.local

# Clerk 认证
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Stripe 支付
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# 数据库
DATABASE_URL=postgresql://xxx
```

::: warning 重要提醒
- 不要将 `.env.local` 文件提交到 Git
- 生产环境请使用正式的 API 密钥
- 保护好你的密钥，不要泄露给他人
:::

## 🏥 健康检查

使用健康检查命令确保一切正常：

```bash
vibe health
```

你应该看到类似这样的输出：

```
🏥 项目健康检查

✅ Node.js 版本: Node.js v18.17.0 (支持)
✅ package.json: package.json 文件存在
✅ Vibe 配置: vibe.config.json 配置文件存在
✅ Git 仓库: Git 仓库已初始化
✅ 依赖安装: 依赖包已安装

✅ 项目健康状态良好！
```

## 🎯 下一步

恭喜！你已经成功创建了你的第一个 Vibe CLI 项目。接下来你可以：

### 学习更多功能
- [创建项目详解](/guide/creating-project) - 深入了解项目创建选项
- [添加集成](/guide/adding-integrations) - 学习如何添加更多功能
- [项目配置](/guide/project-configuration) - 了解配置管理

### 探索集成服务
- [用户认证](/integrations/auth) - 深入了解认证集成
- [支付系统](/integrations/payments) - 学习支付集成
- [国际化](/integrations/i18n) - 配置多语言支持

### 查看模板
- [AI SaaS 模板](/templates/ai-saas) - AI 驱动的 SaaS 应用
- [基础 SaaS 模板](/templates/basic-saas) - 标准的 SaaS 应用
- [电商模板](/templates/e-commerce) - 电商应用模板

## 🆘 遇到问题？

如果在使用过程中遇到问题：

1. **检查健康状态**: `vibe health`
2. **查看详细日志**: `vibe --verbose`
3. **重新安装依赖**: `rm -rf node_modules && npm install`
4. **查看文档**: [故障排除指南](/guide/troubleshooting)
5. **寻求帮助**: [GitHub Issues](https://github.com/vibe-cli/vibe/issues)

---

**�� 开始你的 SaaS 开发之旅吧！** 