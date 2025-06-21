# {{projectName}}

这是一个使用 Vibe CLI 创建的 SaaS 项目。

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 📁 项目结构

```
{{projectName}}/
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
└── README.md
```

## 🔧 添加功能

使用 Vibe CLI 快速添加常用功能：

```bash
# 添加用户认证
vibe install auth --provider=clerk

# 添加支付系统
vibe install payments --provider=stripe

# 添加国际化
vibe install i18n --provider=next-intl

# 添加数据库
vibe install database --provider=supabase
```

## 📚 技术栈

- **前端**: Next.js, React, TypeScript
- **样式**: Tailwind CSS
- **代码质量**: ESLint, Prettier
- **包管理**: npm/yarn/pnpm

## 🛠️ 开发命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 代码检查
npm run type-check # 类型检查
```

## 📖 更多信息

- [Vibe CLI 文档](https://docs.vibe-cli.com)
- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://reactjs.org/docs) 