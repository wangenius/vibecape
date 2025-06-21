# 创建项目详解

本指南将深入介绍如何使用 Vibe CLI 创建不同类型的 SaaS 项目，包括各种配置选项和最佳实践。

## 🎯 创建方式

### 1. 交互式创建（推荐）

最简单的方式是使用交互式命令，系统会引导你完成所有配置：

```bash
vibe create
```

系统会逐步询问：

```bash
? 项目名称: my-awesome-saas
? 项目描述: 我的第一个 SaaS 应用
? 选择项目模板: 
  ❯ AI SaaS Template - AI 驱动的 SaaS 应用
    Basic SaaS Template - 通用 SaaS 应用
    E-commerce Template - 电商应用
? 选择包管理器: 
  ❯ npm
    yarn
    pnpm
? 启用 TypeScript: Yes
? 启用 Tailwind CSS: Yes
? 启用 ESLint: Yes
? 初始化 Git 仓库: Yes
```

### 2. 命令行直接创建

如果你已经明确知道要什么配置，可以直接指定参数：

```bash
vibe create my-saas-app \
  --template=ai-saas \
  --package-manager=npm \
  --typescript \
  --tailwind \
  --eslint \
  --git
```

### 3. 使用配置文件

创建一个配置文件来预设项目参数：

```json
// project-config.json
{
  "name": "my-saas-app",
  "template": "ai-saas",
  "packageManager": "npm",
  "typescript": true,
  "tailwind": true,
  "eslint": true,
  "git": true,
  "integrations": [
    {
      "type": "auth",
      "provider": "clerk"
    },
    {
      "type": "payments",
      "provider": "stripe"
    }
  ]
}
```

```bash
vibe create --config=project-config.json
```

## 📦 项目模板选择

### AI SaaS 模板

适合构建 AI 驱动的 SaaS 应用：

```bash
vibe create ai-writing-tool --template=ai-saas
```

**包含功能：**
- OpenAI/Anthropic API 集成
- 用户认证系统 (Clerk)
- 订阅付费系统 (Stripe)
- 使用量统计和限制
- 现代化 UI 组件

**适用场景：**
- AI 写作助手
- 图片生成工具
- 代码生成器
- 智能客服系统

### 基础 SaaS 模板

通用的 SaaS 应用基础架构：

```bash
vibe create project-manager --template=basic-saas
```

**包含功能：**
- 用户管理系统
- 多租户架构
- 仪表板界面
- 通知系统
- 团队协作功能

**适用场景：**
- 项目管理工具
- CRM 系统
- 团队协作平台
- 数据分析工具

### 电商模板

完整的电商解决方案：

```bash
vibe create online-store --template=e-commerce
```

**包含功能：**
- 商品管理系统
- 购物车和结账流程
- 订单管理
- 用户账户系统
- 支付集成

**适用场景：**
- 在线商店
- 数字产品销售
- 订阅服务
- B2B 电商平台

## 🔧 配置选项详解

### TypeScript 支持

启用 TypeScript 可以提供更好的类型安全和开发体验：

```bash
vibe create my-app --typescript
```

**优势：**
- 编译时类型检查
- 更好的 IDE 支持
- 减少运行时错误
- 更好的代码可维护性

### Tailwind CSS

现代化的 CSS 框架，提供快速样式开发：

```bash
vibe create my-app --tailwind
```

**包含配置：**
- Tailwind CSS 核心库
- 响应式设计工具类
- 暗色模式支持
- 自定义设计令牌

### ESLint 代码检查

保证代码质量和一致性：

```bash
vibe create my-app --eslint
```

**包含规则：**
- JavaScript/TypeScript 最佳实践
- React Hooks 规则
- 无障碍性检查
- 性能优化建议

### 包管理器选择

支持多种包管理器：

```bash
# 使用 npm
vibe create my-app --package-manager=npm

# 使用 yarn
vibe create my-app --package-manager=yarn

# 使用 pnpm
vibe create my-app --package-manager=pnpm
```

## 📁 项目结构解析

创建完成后的项目结构：

```
my-saas-app/
├── client/                     # 前端应用
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 认证相关页面
│   │   ├── (dashboard)/       # 仪表板页面
│   │   ├── api/               # API 路由
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   ├── components/            # React 组件
│   │   ├── ui/               # 基础 UI 组件
│   │   ├── layout/           # 布局组件
│   │   └── features/         # 功能组件
│   ├── hooks/                # 自定义 Hooks
│   ├── lib/                  # 工具库
│   ├── services/             # API 服务
│   └── utils/                # 工具函数
├── server/                   # 后端服务 (可选)
│   ├── api/                  # API 实现
│   ├── middleware/           # 中间件
│   ├── services/             # 业务逻辑
│   └── utils/                # 服务端工具
├── types/                    # TypeScript 类型定义
├── docs/                     # 项目文档
├── tests/                    # 测试文件
├── .env.example              # 环境变量模板
├── .env.local                # 本地环境变量
├── .gitignore               # Git 忽略文件
├── next.config.js           # Next.js 配置
├── package.json             # 项目配置
├── tailwind.config.js       # Tailwind 配置
├── tsconfig.json            # TypeScript 配置
├── vibe.config.json         # Vibe CLI 配置
└── README.md                # 项目说明
```

## 🚀 创建后的下一步操作

### 1. 启动开发服务器

```bash
cd my-saas-app
npm install
npm run dev
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
nano .env.local
```

### 3. 添加集成服务

```bash
# 添加用户认证
vibe install auth --provider=clerk

# 添加支付系统
vibe install payments --provider=stripe

# 添加数据库
vibe install database --provider=supabase
```

### 4. 自定义配置

编辑 `vibe.config.json` 来自定义项目配置：

```json
{
  "project": {
    "name": "my-saas-app",
    "version": "1.0.0",
    "description": "我的 SaaS 应用",
    "template": "ai-saas"
  },
  "settings": {
    "packageManager": "npm",
    "typescript": true,
    "tailwind": true,
    "eslint": true
  },
  "integrations": {},
  "deployment": {
    "platform": "vercel",
    "domain": "my-saas-app.com"
  }
}
```

## 🎨 自定义项目

### 修改主题色彩

编辑 `tailwind.config.js`：

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    }
  }
}
```

### 添加自定义组件

```tsx
// components/ui/custom-button.tsx
import { Button } from '@/components/ui/button'

export function CustomButton({ children, ...props }) {
  return (
    <Button 
      className="bg-gradient-to-r from-blue-500 to-purple-600" 
      {...props}
    >
      {children}
    </Button>
  )
}
```

### 配置数据库模型

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // 关联模型
  projects  Project[]
}

model Project {
  id          String   @id @default(cuid())
  title       String
  description String?
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关联用户
  user        User     @relation(fields: [userId], references: [id])
}
```

## 📊 项目健康检查

创建项目后，使用健康检查确保一切正常：

```bash
vibe health
```

输出示例：

```
🏥 项目健康检查

✅ Node.js 版本: v18.17.0 (支持)
✅ 包管理器: npm v9.6.7 (支持)
✅ 项目配置: vibe.config.json 存在
✅ 依赖安装: 所有依赖已安装
✅ TypeScript: 配置正确
✅ Tailwind CSS: 配置正确
✅ ESLint: 配置正确
✅ Git 仓库: 已初始化

🎉 项目健康状态良好！
```

## 🆘 常见问题

### 项目创建失败

```bash
# 清理缓存
vibe cache clean

# 重新创建
vibe create my-app --force
```

### 依赖安装错误

```bash
# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 模板下载失败

```bash
# 使用镜像源
vibe create my-app --registry=https://registry.npmmirror.com
```

### TypeScript 错误

```bash
# 重新生成类型
npm run type-check

# 更新 TypeScript
npm update typescript
```

## 🚀 下一步

项目创建完成后，你可以：

- [添加集成服务](/guide/adding-integrations) - 集成认证、支付等功能
- [项目配置管理](/guide/project-configuration) - 深入了解配置选项
- [部署到生产环境](/guide/deployment) - 发布你的应用
- [最佳实践指南](/guide/best-practices) - 学习开发最佳实践

---

**恭喜！你已经成功创建了第一个 Vibe CLI 项目！** 🎉 