---
layout: home

hero:
  name: "vibecape"
  text: "SaaS 应用搭建神器"
  tagline: 让开发者用一行命令就能快速搭建出完整的在线服务系统
  image:
    src: /logo.png
    alt: Vibe CLI
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看 GitHub
      link: https://github.com/vibe-cli/vibe

features:
  - icon: ⚡
    title: 超快速
    details: 30分钟搭建完成，不是30天。一行命令解决复杂配置，不需要懂技术细节。
  - icon: 🎯
    title: 超简单
    details: 交互式命令行界面，智能选择最佳配置，内置最佳实践。
  - icon: 🏆
    title: 超专业
    details: 内置最佳实践，媲美大厂技术架构，支持主流 SaaS 服务集成。
  - icon: 🔧
    title: 超灵活
    details: 需要什么功能就加什么，模块化设计，支持自定义扩展。
  - icon: 🌍
    title: 国际化
    details: 内置多语言支持，一键配置国际化，支持 next-intl 等主流方案。
  - icon: 💳
    title: 支付集成
    details: 支持 Stripe、Paddle 等主流支付平台，订阅管理开箱即用。
---

## 🚀 一分钟上手

```bash
# 安装 Vibe CLI
npm install -g vibecape

# 创建新项目
vibe create my-app

# 添加用户认证
vibe install auth --provider=clerk

# 添加支付系统
vibe install payments --provider=stripe

# 项目就绪！
npm run dev
```

## 💡 核心价值

**问题：** 搭建一个完整的在线服务很复杂，需要几周甚至几个月

**解决：** 我们把复杂的事情简单化，让你专注于核心业务

- **🎯 超简单**：一行命令解决复杂配置，不需要懂技术细节
- **⚡ 超快速**：30分钟搭建完成，不是30天
- **🏆 超专业**：内置最佳实践，媲美大厂技术架构
- **🔧 超灵活**：需要什么功能就加什么，不浪费资源

## 🛠️ 支持的集成

<div class="feature-grid">

### 认证服务
- **Clerk** - 现代化用户认证
- **NextAuth** - Next.js 官方方案
- **Supabase Auth** - 开源认证服务

### 支付系统
- **Stripe** - 全球支付平台
- **Paddle** - 税务处理
- **LemonSqueezy** - 独立开发者友好

### 数据库
- **Supabase** - PostgreSQL + 实时功能
- **PlanetScale** - MySQL + 分支管理
- **Neon** - 无服务器 PostgreSQL

### 其他服务
- **国际化** - next-intl, react-i18next
- **邮件** - Resend, SendGrid, Mailgun
- **存储** - Cloudinary, AWS S3, Supabase Storage
- **分析** - Mixpanel, PostHog, Google Analytics

</div>

## 🎯 适用场景

<div class="use-cases">

### 🚀 独立开发者
快速验证想法，专注核心功能开发

### 💼 初创公司
快速搭建 MVP，节省开发时间和成本

### 🏢 企业团队
标准化项目结构，提高开发效率

### 🎨 设计师转开发
无需深入技术细节，快速实现创意

</div>

<style>
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.feature-grid > div {
  padding: 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
}

.use-cases {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.use-cases > div {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  text-align: center;
}
</style> 