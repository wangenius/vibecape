# 用户认证集成

用户认证是大多数 SaaS 应用的核心功能。Vibe CLI 支持多种主流的认证服务提供商，让你可以快速为应用添加用户注册、登录、权限管理等功能。

## 🚀 快速开始

```bash
# 交互式安装认证集成
vibe install auth

# 直接指定提供商
vibe install auth --provider=clerk
```

## 📦 支持的提供商

### Clerk - 现代化认证服务

**特点：**
- 🎨 开箱即用的 UI 组件
- 🔐 支持多种社交登录
- 📱 多因素认证 (MFA)
- 👥 用户管理面板
- 🌍 国际化支持

**安装：**
```bash
vibe install auth --provider=clerk
```

**配置示例：**
```bash
? 是否启用社交登录: Yes
? 选择社交登录平台: Google, GitHub, Apple
? 是否启用多因素认证: Yes
? 自定义域名 (可选): auth.myapp.com
```

### NextAuth - Next.js 官方方案

**特点：**
- ⚡ Next.js 深度集成
- 🔧 高度可定制
- 🛡️ 安全性优先
- 📚 丰富的提供商支持
- 🗄️ 多种数据库支持

**安装：**
```bash
vibe install auth --provider=nextauth
```

**配置示例：**
```bash
? 选择认证提供商: Google, GitHub, Discord
? 选择数据库: PostgreSQL (Supabase)
? 是否启用邮箱验证: Yes
? JWT 密钥策略: Auto-generate
```

### Supabase Auth - 开源解决方案

**特点：**
- 🆓 开源免费
- 🗄️ 与数据库深度集成
- 📧 内置邮箱验证
- 🔑 行级安全 (RLS)
- 📱 移动端支持

**安装：**
```bash
vibe install auth --provider=supabase
```

**配置示例：**
```bash
? Supabase 项目 URL: https://xxx.supabase.co
? 是否启用社交登录: Yes
? 选择社交登录平台: Google, GitHub
? 是否启用邮箱确认: Yes
```

## 🛠️ 安装后配置

### 1. 环境变量设置

根据选择的提供商，需要配置相应的环境变量：

#### Clerk
```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

#### NextAuth
```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

#### Supabase
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

### 2. 获取 API 密钥

#### Clerk
1. 访问 [Clerk Dashboard](https://dashboard.clerk.com)
2. 创建新应用或选择现有应用
3. 在 "API Keys" 页面复制密钥
4. 配置认证设置和社交登录

#### NextAuth
1. **Google**: 访问 [Google Cloud Console](https://console.cloud.google.com)
2. **GitHub**: 访问 [GitHub Developer Settings](https://github.com/settings/developers)
3. **Discord**: 访问 [Discord Developer Portal](https://discord.com/developers/applications)

#### Supabase
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目或选择现有项目
3. 在 "Settings > API" 页面复制密钥
4. 配置认证设置

## 📝 使用示例

### Clerk 集成示例

```tsx
// pages/_app.tsx
import { ClerkProvider } from '@clerk/nextjs'

function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider>
      <Component {...pageProps} />
    </ClerkProvider>
  )
}

export default MyApp
```

```tsx
// components/AuthButton.tsx
import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs'

export function AuthButton() {
  const { isSignedIn, user } = useUser()

  if (isSignedIn) {
    return (
      <div>
        <span>Hello, {user.firstName}!</span>
        <SignOutButton />
      </div>
    )
  }

  return <SignInButton />
}
```

### NextAuth 集成示例

```tsx
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
})
```

```tsx
// components/AuthButton.tsx
import { useSession, signIn, signOut } from 'next-auth/react'

export function AuthButton() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div>
        <span>Hello, {session.user?.name}!</span>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    )
  }

  return <button onClick={() => signIn()}>Sign in</button>
}
```

### Supabase 集成示例

```tsx
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

```tsx
// components/AuthButton.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function AuthButton() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (user) {
    return (
      <div>
        <span>Hello, {user.email}!</span>
        <button onClick={signOut}>Sign out</button>
      </div>
    )
  }

  return <button onClick={signIn}>Sign in</button>
}
```

## 🔧 高级配置

### 自定义认证流程

```json
// vibe.config.json
{
  "integrations": {
    "auth": {
      "provider": "clerk",
      "config": {
        "signInUrl": "/sign-in",
        "signUpUrl": "/sign-up",
        "afterSignInUrl": "/dashboard",
        "afterSignUpUrl": "/onboarding",
        "socialProviders": ["google", "github", "apple"],
        "multiFactor": true,
        "customDomain": "auth.myapp.com"
      }
    }
  }
}
```

### 用户角色和权限

```tsx
// middleware.ts (Clerk 示例)
import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: ["/", "/pricing", "/about"],
  ignoredRoutes: ["/api/webhook"],
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

### 数据库集成

```sql
-- 用户表结构 (PostgreSQL)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户角色表
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📊 最佳实践

### 1. 安全性

- 使用 HTTPS 在生产环境
- 定期轮换 API 密钥
- 启用多因素认证
- 实施密码策略
- 监控异常登录行为

### 2. 用户体验

- 提供多种登录方式
- 优化注册流程
- 实现单点登录 (SSO)
- 支持社交登录
- 提供密码重置功能

### 3. 性能优化

- 使用 JWT 减少数据库查询
- 实施会话管理
- 缓存用户信息
- 异步处理认证事件

### 4. 合规性

- 遵守 GDPR 规定
- 实施数据保护
- 提供用户数据导出
- 支持账户删除

## 🆘 故障排除

### 常见问题

**认证重定向循环**
```bash
# 检查环境变量配置
echo $NEXTAUTH_URL
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# 确保 URL 配置正确
```

**社交登录失败**
```bash
# 检查 OAuth 配置
# 1. 回调 URL 是否正确
# 2. 客户端 ID/密钥是否有效
# 3. 应用域名是否已授权
```

**用户数据同步问题**
```bash
# 检查 Webhook 配置
vibe config get integrations.auth.webhooks

# 测试 Webhook 端点
curl -X POST localhost:3000/api/webhooks/auth
```

### 调试技巧

```tsx
// 启用调试模式
export default NextAuth({
  debug: process.env.NODE_ENV === 'development',
  // ... 其他配置
})
```

```tsx
// Clerk 调试信息
import { useUser } from '@clerk/nextjs'

export function DebugUser() {
  const { user, isLoaded } = useUser()
  
  if (!isLoaded) return <div>Loading...</div>
  
  return (
    <pre>{JSON.stringify(user, null, 2)}</pre>
  )
}
```

## 🚀 下一步

认证集成完成后，你可能还需要：

- [数据库集成](/integrations/database) - 存储用户数据
- [邮件服务](/integrations/email) - 发送验证邮件
- [支付系统](/integrations/payments) - 用户订阅管理
- [分析监控](/integrations/analytics) - 追踪用户行为

---

**用户认证是 SaaS 应用的基础，选择合适的方案让你事半功倍！** 🔐 