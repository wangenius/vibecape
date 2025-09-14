# vibecape

一个现代化的全栈模版，基于 Next.js 15、TypeScript、Tailwind v4 和 shadcn/ui，内置认证、数据库、支付、文档站等常用能力，开箱即用、可按需删改。

## 功能特性

- 核心栈: TypeScript + React + Next.js 15 (App Router)
- UI/样式: Tailwind CSS v4、shadcn/ui、Radix UI、主题切换
- 状态管理: Zustand、`use-mobile` 等实用 Hooks
- 认证: better-auth（含登录/注册页面与 API 路由）
- 数据库: Drizzle ORM + LibSQL（`drizzle.config.ts` + 迁移脚本）
- 文档站: Fumadocs（`/docs` 路由 + `content/docs` MDX 文档）
- 支付: Stripe 一次性与订阅支付，Webhook 已配置
- API 示例: 支付、搜索、Auth 等 API 路由
- 代码质量: Biome 格式化/检查脚本

## 目录概览

```
src/
  app/                    # Next.js App Router 页面与路由
    api/
      auth/[...all]/route.ts          # better-auth 适配路由
      payment/                        # Stripe 支付相关 API
        create/route.ts
        status/route.ts
        product/route.ts
        webhooks/stripe/route.ts
      search/route.ts
    docs/[[...slug]]/page.tsx         # 文档详情页
    docs/layout.tsx
    payment/*                         # 支付成功/取消等页面
    login/page.tsx                    # 登录页
    register/page.tsx                 # 注册页
    admin/*                           # 管理端示例页面
    page.tsx                          # 落地页
    layout.tsx

  components/              # 业务与 UI 组件（shadcn/ui 已就绪）
  hooks/                   # 自定义 Hooks（含 Stripe 产品获取）
  lib/                     # axios 封装、utils、layout 共享
  services/                # 领域服务（auth / payment / database）
    payment/README.md      # Stripe 使用说明（更详细）

content/docs/              # 文档内容（MDX）
public/                    # 静态资源
```

## 快速开始

1. 获取代码

```bash
git clone https://github.com/wangenius/vibecape.git
cd vibecape
```

或使用 CLI：

```bash
npm i -g vibecape
vibe create template
```

2. 执行配置脚本

```bash
bash ./scripts/pre.sh
```
或者
```bash
npm run prepare
```

4. 初始化数据库（如需）

```bash
pnpm generate   # 生成迁移
pnpm migrate    # 执行迁移
# 或 pnpm db:push
```

5. 本地开发

```bash
npm run dev
# 访问 http://localhost:3000
```

## 常用脚本

- `dev`: 启动开发（Turbopack）
- `build`: 构建（Turbopack）
- `start`: 生产模式运行
- `lint`: Biome 检查
- `format`: Biome 格式化
- `generate / migrate / db:push`: Drizzle 迁移相关

## 文档站（Fumadocs）

- 内容位于 `content/docs/*`
- 路由：`/docs`，页面：`src/app/docs/*`

可将你的产品文档/指南以 MDX 形式维护并自动生成站点。

## UI 与样式

- Tailwind v4 + shadcn/ui + Radix UI
- 组件示例：`src/components/ui/*` 与业务区块 `src/components/sections/*`
- 全局样式：`src/styles/*`

## 部署建议

- 平台：Vercel（推荐 Next.js 原生支持）
- 环境变量：在平台上配置与 `.env.local` 一致的变量
- Stripe Webhook：指向 `/api/payment/webhooks/stripe`
- 数据库：按 `drizzle.config.ts` 选择的驱动部署（如 LibSQL / Postgres）

## 注意事项

- 请勿提交包含密钥的 `.env*` 文件
- Webhook 必须校验签名，生产环境开启 HTTPS
- 如未使用某模块（如支付/文档/管理端），可直接删除对应目录与依赖以精简体积

## 许可

本仓库为模板用途，按你的项目政策自行添加 LICENSE。如需协助补充开源协议或版权声明，请提出需求。
