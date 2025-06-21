# 集成概述

Vibe CLI 的核心优势之一就是能够快速集成各种主流的 SaaS 服务和中间件。通过简单的命令，你可以在几分钟内为你的项目添加认证、支付、数据库等功能。

## 🚀 快速开始

使用 `vibe install` 命令可以快速添加任何集成：

```bash
# 交互式选择集成
vibe install

# 直接指定集成类型
vibe install auth --provider=clerk
```

## 📦 支持的集成类型

### 🔐 [用户认证](/integrations/auth)
快速添加用户注册、登录、权限管理功能。

**支持的提供商：**
- **Clerk** - 现代化的用户认证服务，开箱即用的 UI 组件
- **NextAuth** - Next.js 官方认证解决方案，灵活配置
- **Supabase Auth** - 开源认证服务，与数据库深度集成

```bash
vibe install auth --provider=clerk
```

### 💳 [支付系统](/integrations/payments)
集成支付处理、订阅管理、发票系统。

**支持的提供商：**
- **Stripe** - 全球领先的支付平台，支持订阅和一次性付款
- **Paddle** - 专注于 SaaS 的支付平台，处理税务和合规
- **LemonSqueezy** - 独立开发者友好的支付解决方案

```bash
vibe install payments --provider=stripe
```

### 🌍 [国际化](/integrations/i18n)
添加多语言支持，让你的应用面向全球用户。

**支持的方案：**
- **next-intl** - Next.js 优化的国际化解决方案
- **react-i18next** - 成熟的 React 国际化库

```bash
vibe install i18n --provider=next-intl
```

### 🗄️ [数据库](/integrations/database)
快速配置数据库连接和 ORM。

**支持的提供商：**
- **Supabase** - PostgreSQL + 实时功能 + 认证
- **PlanetScale** - MySQL + 分支管理 + 无服务器
- **Neon** - PostgreSQL + 无服务器 + 自动扩缩容

```bash
vibe install database --provider=supabase
```

### 📧 [邮件服务](/integrations/email)
集成邮件发送、模板管理、邮件追踪。

**支持的提供商：**
- **Resend** - 现代化的邮件 API，开发者友好
- **SendGrid** - 企业级邮件服务，高送达率
- **Mailgun** - 强大的邮件 API，灵活配置

```bash
vibe install email --provider=resend
```

### 📁 [文件存储](/integrations/storage)
添加文件上传、图片处理、CDN 分发功能。

**支持的提供商：**
- **Cloudinary** - 图片和视频处理 + CDN
- **AWS S3** - 可靠的对象存储服务
- **Supabase Storage** - 开源存储解决方案 + 权限控制

```bash
vibe install storage --provider=cloudinary
```

### 📊 [分析监控](/integrations/analytics)
集成用户行为分析、性能监控、错误追踪。

**支持的提供商：**
- **Mixpanel** - 强大的用户行为分析
- **PostHog** - 开源的产品分析平台
- **Google Analytics** - 免费的网站分析工具

```bash
vibe install analytics --provider=mixpanel
```

## 🛠️ 集成工作流程

### 1. 选择集成

```bash
vibe install
```

系统会显示可用的集成类型，选择你需要的功能。

### 2. 选择提供商

根据你的需求选择合适的服务提供商：

- **功能需求** - 不同提供商支持的功能可能不同
- **价格考虑** - 比较不同提供商的定价策略
- **技术栈** - 选择与你的技术栈兼容的方案
- **开发体验** - 考虑文档质量和开发工具

### 3. 配置参数

根据提示配置集成参数：

```bash
? 是否启用社交登录: Yes
? 选择社交登录平台: Google, GitHub
? 是否启用双因素认证: No
```

### 4. 安装完成

集成安装完成后，系统会：

- ✅ 安装必要的依赖包
- ✅ 生成配置文件和环境变量模板
- ✅ 创建示例代码和组件
- ✅ 更新项目配置
- ✅ 提供下一步操作指南

### 5. 配置环境变量

根据提示配置必要的 API 密钥：

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

## 🔧 高级配置

### 自定义配置

你可以通过配置文件自定义集成行为：

```json
// vibe.config.json
{
  "integrations": {
    "auth": {
      "provider": "clerk",
      "config": {
        "socialLogin": true,
        "providers": ["google", "github"],
        "customDomain": "auth.myapp.com"
      }
    }
  }
}
```

### 多环境配置

支持不同环境使用不同的配置：

```bash
# 开发环境
vibe install auth --provider=clerk --env=development

# 生产环境
vibe install auth --provider=clerk --env=production
```

### 条件集成

根据项目类型自动选择合适的集成：

```bash
# AI 项目自动推荐 OpenAI 集成
vibe create ai-app --template=ai-saas
vibe install ai --provider=openai

# 电商项目自动推荐支付和库存管理
vibe create shop --template=e-commerce
vibe install payments --provider=stripe
vibe install inventory --provider=shopify
```

## 📚 最佳实践

### 1. 集成顺序

推荐的集成安装顺序：

1. **数据库** - 首先建立数据存储
2. **认证** - 用户系统是其他功能的基础
3. **支付** - 如果是付费应用
4. **邮件** - 用于通知和营销
5. **存储** - 文件上传功能
6. **分析** - 了解用户行为
7. **国际化** - 面向全球用户

### 2. 环境变量管理

- 使用 `.env.example` 文件记录所需的环境变量
- 不同环境使用不同的配置文件
- 敏感信息不要提交到版本控制

### 3. 渐进式集成

- 从核心功能开始，逐步添加高级功能
- 先在开发环境测试，确认无误后再部署到生产环境
- 定期更新集成版本，保持安全性

### 4. 监控和维护

- 定期检查集成状态：`vibe health`
- 及时更新过期的 API 密钥
- 监控集成服务的使用量和费用

## 🆘 故障排除

### 常见问题

**集成安装失败**
```bash
# 检查网络连接
vibe install auth --provider=clerk --verbose

# 清理缓存重试
vibe cache clean
vibe install auth --provider=clerk
```

**环境变量未生效**
```bash
# 检查环境变量文件
cat .env.local

# 重启开发服务器
npm run dev
```

**集成冲突**
```bash
# 检查已安装的集成
vibe config list

# 卸载冲突的集成
vibe uninstall conflicting-integration
```

### 获取帮助

- 查看集成文档：`vibe help <integration>`
- 健康检查：`vibe health`
- 社区支持：[GitHub Discussions](https://github.com/vibe-cli/vibe/discussions)
- 问题反馈：[GitHub Issues](https://github.com/vibe-cli/vibe/issues)

## 🚀 下一步

选择你需要的集成开始吧：

- [用户认证](/integrations/auth) - 添加用户系统
- [支付系统](/integrations/payments) - 集成支付功能
- [国际化](/integrations/i18n) - 支持多语言
- [数据库](/integrations/database) - 配置数据存储

---

**让 Vibe CLI 帮你快速搭建完整的 SaaS 应用！** 🎉 