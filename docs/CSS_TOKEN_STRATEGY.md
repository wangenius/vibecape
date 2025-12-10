# Vibecape CSS Token 策略文档

> 基于 Tailwind CSS v4 `@theme inline` 的统一设计系统

---

## 目录

1. [设计原则](#设计原则)
2. [当前问题分析](#当前问题分析)
3. [新架构设计](#新架构设计)
4. [Token Schema 定义](#token-schema-定义)
5. [使用规范](#使用规范)
6. [迁移指南](#迁移指南)
7. [跨平台一致性](#跨平台一致性)

---

## 设计原则

### 核心目标

- **Token 化**：所有样式值来自 Token，禁止硬编码
- **主题感知**：UI 自动跟随主题切换
- **跨平台一致**：web、docs、landing、app 使用相同 Token Schema
- **模块化**：Token 系统可复用、可扩展

### 关键规则

```
❌ 禁止：<div class="bg-white text-black p-4 rounded-xl">
✅ 正确：<div class="bg-bg text-fg p-md rounded-md">
```

---

## 当前问题分析

### 问题 1：Token 分散且重复

```
@styles/
├── tokens/           # 使用 :root 定义
│   ├── colors.css
│   ├── spacing.css
│   └── ...
└── theme/            # 每个文件重复 @theme inline
    ├── default.css   # 包含 @theme inline
    ├── dim.css       # 包含 @theme inline (重复)
    └── ocean.css     # 包含 @theme inline (重复)
```

### 问题 2：主题文件冗余

每个主题文件都包含约 50 行相同的 `@theme inline` 块，维护成本高。

### 问题 3：组件硬编码

```tsx
// button.tsx 中的硬编码值
"rounded-2xl px-2 h-7 text-sm"  // ❌ 应使用 token
```

### 问题 4：缺少语义化 spacing

当前使用 Tailwind 默认值 `p-4`、`text-sm`，无法统一调整。

---

## 新架构设计

### 目录结构

```
@styles/
├── tokens.css           # 🔑 唯一的 @theme inline 定义
├── themes/
│   ├── default.css      # :root + .dark 变量
│   ├── dim.css          # [data-theme="dim"] 变量
│   ├── ocean.css        # [data-theme="ocean"] 变量
│   └── ...
├── base.css             # @layer base 组件基础样式
├── components.css       # @layer components 复合组件
└── utilities.css        # @layer utilities 工具类
```

### 入口文件 `main.css`

```css
/* 1. Tailwind 核心 */
@import "tailwindcss";
@plugin "tailwindcss-animate";
@plugin "@tailwindcss/typography";

/* 2. 主题变量（只定义 CSS 变量） */
@import "@/@styles/themes/default.css";
@import "@/@styles/themes/dim.css";
@import "@/@styles/themes/ocean.css";
/* ... 其他主题 */

/* 3. 统一 Token 定义（唯一的 @theme inline） */
@import "@/@styles/tokens.css";

/* 4. 基础样式 */
@import "@/@styles/base.css";

/* 5. 工具类 */
@import "@/@styles/utilities.css";
```

---

## Token Schema 定义

### `tokens.css` 完整定义

```css
/* @styles/tokens.css - 统一 Token Schema */
@theme inline {
  /* ══════════════════════════════════════════
     COLORS - 语义化颜色
     ══════════════════════════════════════════ */
  
  /* 背景色 */
  --color-bg: var(--background);
  --color-bg-elevated: var(--card);
  --color-bg-muted: var(--muted);
  --color-bg-popover: var(--popover);
  
  /* 前景色 */
  --color-fg: var(--foreground);
  --color-fg-muted: var(--muted-foreground);
  --color-fg-card: var(--card-foreground);
  --color-fg-popover: var(--popover-foreground);
  
  /* 主色调 */
  --color-primary: var(--primary);
  --color-primary-fg: var(--primary-foreground);
  
  /* 次要色 */
  --color-secondary: var(--secondary);
  --color-secondary-fg: var(--secondary-foreground);
  
  /* 强调色 */
  --color-accent: var(--accent);
  --color-accent-fg: var(--accent-foreground);
  
  /* 危险色 */
  --color-destructive: var(--destructive);
  --color-destructive-fg: var(--destructive-foreground);
  
  /* 边框与输入 */
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  
  /* 侧边栏 */
  --color-sidebar: var(--sidebar);
  --color-sidebar-fg: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-fg: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-fg: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  
  /* 图表色 */
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  
  /* 状态色 */
  --color-success: var(--success, #22c55e);
  --color-warning: var(--warning, #f59e0b);
  --color-error: var(--destructive);
  --color-info: var(--info, #3b82f6);

  /* ══════════════════════════════════════════
     SPACING - 间距系统
     ══════════════════════════════════════════ */
  
  /* 基础间距 */
  --spacing-0: 0;
  --spacing-px: 1px;
  --spacing-0\.5: 0.125rem;   /* 2px */
  --spacing-1: 0.25rem;       /* 4px */
  --spacing-1\.5: 0.375rem;   /* 6px */
  --spacing-2: 0.5rem;        /* 8px */
  --spacing-2\.5: 0.625rem;   /* 10px */
  --spacing-3: 0.75rem;       /* 12px */
  --spacing-4: 1rem;          /* 16px */
  --spacing-5: 1.25rem;       /* 20px */
  --spacing-6: 1.5rem;        /* 24px */
  --spacing-8: 2rem;          /* 32px */
  --spacing-10: 2.5rem;       /* 40px */
  --spacing-12: 3rem;         /* 48px */
  --spacing-16: 4rem;         /* 64px */
  --spacing-20: 5rem;         /* 80px */
  --spacing-24: 6rem;         /* 96px */
  
  /* 语义化间距 */
  --spacing-xs: var(--spacing-1);    /* 4px */
  --spacing-sm: var(--spacing-2);    /* 8px */
  --spacing-md: var(--spacing-4);    /* 16px */
  --spacing-lg: var(--spacing-6);    /* 24px */
  --spacing-xl: var(--spacing-8);    /* 32px */
  --spacing-2xl: var(--spacing-12);  /* 48px */

  /* ══════════════════════════════════════════
     TYPOGRAPHY - 字体系统
     ══════════════════════════════════════════ */
  
  /* 字体族 */
  --font-sans: var(--font-sans);
  --font-serif: var(--font-serif);
  --font-mono: var(--font-mono);
  
  /* 字号 */
  --text-xs: 0.6875rem;       /* 11px */
  --text-sm: 0.75rem;         /* 12px */
  --text-base: 0.875rem;      /* 14px */
  --text-lg: 1rem;            /* 16px */
  --text-xl: 1.25rem;         /* 20px */
  --text-2xl: 1.5rem;         /* 24px */
  --text-3xl: 1.875rem;       /* 30px */
  --text-4xl: 2.25rem;        /* 36px */
  
  /* 行高 */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
  
  /* 字重 */
  --font-thin: 100;
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;

  /* ══════════════════════════════════════════
     RADIUS - 圆角系统
     ══════════════════════════════════════════ */
  
  --radius-none: 0;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 16px);
  --radius-full: 9999px;

  /* ══════════════════════════════════════════
     SHADOWS - 阴影系统
     ══════════════════════════════════════════ */
  
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  --shadow-none: 0 0 #0000;

  /* ══════════════════════════════════════════
     TRANSITIONS - 动画系统
     ══════════════════════════════════════════ */
  
  /* 时长 */
  --duration-75: 75ms;
  --duration-100: 100ms;
  --duration-150: 150ms;
  --duration-200: 200ms;
  --duration-300: 300ms;
  --duration-500: 500ms;
  --duration-700: 700ms;
  --duration-1000: 1000ms;
  
  /* 语义化时长 */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  
  /* 缓动函数 */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);

  /* ══════════════════════════════════════════
     Z-INDEX - 层级系统
     ══════════════════════════════════════════ */
  
  --z-0: 0;
  --z-10: 10;
  --z-20: 20;
  --z-30: 30;
  --z-40: 40;
  --z-50: 50;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
  --z-max: 9999;

  /* ══════════════════════════════════════════
     SIZING - 尺寸系统
     ══════════════════════════════════════════ */
  
  /* 组件高度 */
  --size-xs: 1.5rem;          /* 24px */
  --size-sm: 1.75rem;         /* 28px */
  --size-md: 2rem;            /* 32px */
  --size-lg: 2.5rem;          /* 40px */
  --size-xl: 3rem;            /* 48px */
}
```

### 主题文件示例

```css
/* @styles/themes/default.css - 只定义 CSS 变量 */
:root {
  --background: rgb(255, 255, 255);
  --foreground: rgb(10, 10, 10);
  --card: rgb(255, 255, 255);
  --card-foreground: rgb(10, 10, 10);
  --popover: rgb(255, 255, 255);
  --popover-foreground: rgb(10, 10, 10);
  --primary: rgb(23, 23, 23);
  --primary-foreground: rgb(250, 250, 250);
  --secondary: rgb(245, 245, 245);
  --secondary-foreground: rgb(23, 23, 23);
  --muted: rgb(245, 245, 245);
  --muted-foreground: rgb(115, 115, 115);
  --accent: rgb(245, 245, 245);
  --accent-foreground: rgb(23, 23, 23);
  --destructive: rgb(231, 0, 11);
  --destructive-foreground: rgb(255, 255, 255);
  --border: rgb(229, 229, 229);
  --input: rgb(229, 229, 229);
  --ring: rgb(161, 161, 161);
  --chart-1: rgb(145, 197, 255);
  --chart-2: rgb(58, 129, 246);
  --chart-3: rgb(37, 99, 239);
  --chart-4: rgb(26, 78, 218);
  --chart-5: rgb(31, 63, 173);
  --sidebar: rgb(250, 250, 250);
  --sidebar-foreground: rgb(10, 10, 10);
  --sidebar-primary: rgb(23, 23, 23);
  --sidebar-primary-foreground: rgb(250, 250, 250);
  --sidebar-accent: rgb(245, 245, 245);
  --sidebar-accent-foreground: rgb(23, 23, 23);
  --sidebar-border: rgb(229, 229, 229);
  --sidebar-ring: rgb(161, 161, 161);
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --radius: 0.625rem;
}

.dark {
  --background: rgb(10, 10, 10);
  --foreground: rgb(250, 250, 250);
  --card: rgb(23, 23, 23);
  --card-foreground: rgb(250, 250, 250);
  --popover: rgb(38, 38, 38);
  --popover-foreground: rgb(250, 250, 250);
  --primary: rgb(229, 229, 229);
  --primary-foreground: rgb(23, 23, 23);
  --secondary: rgb(38, 38, 38);
  --secondary-foreground: rgb(250, 250, 250);
  --muted: rgb(38, 38, 38);
  --muted-foreground: rgb(161, 161, 161);
  --accent: rgb(64, 64, 64);
  --accent-foreground: rgb(250, 250, 250);
  --destructive: rgb(255, 100, 103);
  --destructive-foreground: rgb(250, 250, 250);
  --border: rgb(40, 40, 40);
  --input: rgb(52, 52, 52);
  --ring: rgb(115, 115, 115);
  --chart-1: rgb(145, 197, 255);
  --chart-2: rgb(58, 129, 246);
  --chart-3: rgb(37, 99, 239);
  --chart-4: rgb(26, 78, 218);
  --chart-5: rgb(31, 63, 173);
  --sidebar: rgb(23, 23, 23);
  --sidebar-foreground: rgb(250, 250, 250);
  --sidebar-primary: rgb(20, 71, 230);
  --sidebar-primary-foreground: rgb(250, 250, 250);
  --sidebar-accent: rgb(38, 38, 38);
  --sidebar-accent-foreground: rgb(250, 250, 250);
  --sidebar-border: rgb(40, 40, 40);
  --sidebar-ring: rgb(82, 82, 82);
}

/* ❌ 不再需要 @theme inline - 统一在 tokens.css 中定义 */
```

---

## 使用规范

### 颜色 Token

| Token | 用途 | 示例 |
|-------|------|------|
| `bg-bg` | 主背景 | 页面背景 |
| `bg-bg-elevated` | 提升背景 | 卡片、弹窗 |
| `bg-bg-muted` | 柔和背景 | 次要区域 |
| `text-fg` | 主文字 | 标题、正文 |
| `text-fg-muted` | 次要文字 | 描述、提示 |
| `bg-primary` | 主色背景 | 主按钮 |
| `text-primary-fg` | 主色文字 | 主按钮文字 |
| `border-border` | 边框 | 分割线、边框 |

### 间距 Token

| Token | 值 | 用途 |
|-------|-----|------|
| `p-xs` | 4px | 紧凑内边距 |
| `p-sm` | 8px | 小内边距 |
| `p-md` | 16px | 标准内边距 |
| `p-lg` | 24px | 大内边距 |
| `p-xl` | 32px | 超大内边距 |
| `gap-sm` | 8px | 小间隙 |
| `gap-md` | 16px | 标准间隙 |

### 圆角 Token

| Token | 用途 |
|-------|------|
| `rounded-sm` | 小圆角（按钮内元素） |
| `rounded-md` | 标准圆角（按钮、输入框） |
| `rounded-lg` | 大圆角（卡片） |
| `rounded-xl` | 超大圆角（模态框） |
| `rounded-full` | 圆形（头像） |

### 代码示例

```tsx
// ✅ 正确：使用语义化 Token
const Card = ({ children }) => (
  <div className="bg-bg-elevated text-fg p-md rounded-lg shadow-md border border-border">
    {children}
  </div>
);

const Button = ({ children, variant = "primary" }) => (
  <button className={cn(
    "px-md py-sm rounded-md font-medium transition-colors duration-fast",
    variant === "primary" && "bg-primary text-primary-fg hover:bg-primary/90",
    variant === "secondary" && "bg-secondary text-secondary-fg hover:bg-secondary/80",
    variant === "ghost" && "bg-transparent hover:bg-bg-muted"
  )}>
    {children}
  </button>
);

const Input = () => (
  <input className="bg-input text-fg border border-border rounded-md px-sm py-xs focus:ring-2 focus:ring-ring" />
);
```

```tsx
// ❌ 错误：硬编码值
const Card = ({ children }) => (
  <div className="bg-white text-black p-4 rounded-xl shadow-md border border-gray-200">
    {children}
  </div>
);
```

---

## 迁移指南

### 阶段 1：Token 系统重构（高优先级）

1. 创建 `@styles/tokens.css`
2. 移除各主题文件中的 `@theme inline` 块
3. 删除 `@styles/tokens/` 目录
4. 更新 `main.css` 导入顺序

### 阶段 2：组件迁移（中优先级）

| 文件 | 迁移内容 |
|------|----------|
| `button.tsx` | `rounded-2xl` → `rounded-md`, `px-2 h-7` → `px-sm ` |
| `input.tsx` | 统一使用 `bg-input border-border` |
| `dialog.tsx` | `rounded-lg` → `rounded-xl`, `p-6` → `p-lg` |

### 阶段 3：全局检查（低优先级）

```bash
# 检查硬编码颜色
grep -r "bg-white\|bg-black\|text-white\|text-black" src/

# 检查硬编码间距
grep -r "p-\[.*px\]\|m-\[.*px\]" src/

# 检查硬编码圆角
grep -r "rounded-\[.*\]" src/
```

### 映射表

| 旧值 | 新值 |
|------|------|
| `bg-white` | `bg-bg` |
| `bg-black` | `bg-fg` |
| `text-white` | `text-bg` |
| `text-black` | `text-fg` |
| `text-gray-500` | `text-fg-muted` |
| `bg-gray-100` | `bg-bg-muted` |
| `p-4` | `p-md` |
| `p-2` | `p-sm` |
| `p-6` | `p-lg` |
| `rounded-xl` | `rounded-lg` |
| `rounded-2xl` | `rounded-xl` |

---

## 跨平台一致性

### 共享 Token 方案

```
vibecape/
├── shared/
│   └── styles/
│       └── tokens.css        # 共享 Token 定义
├── package/                   # Electron App
│   └── src/renderer/@styles/
│       └── main.css          # @import "../../../shared/styles/tokens.css"
└── homepage/                  # Next.js Website
    └── app/
        └── app.css           # @import "../shared/styles/tokens.css"
```

### 或使用符号链接

```bash
# 在 package 和 homepage 中创建符号链接
ln -s ../../shared/styles/tokens.css package/src/renderer/@styles/tokens.css
ln -s ../shared/styles/tokens.css homepage/app/styles/tokens.css
```

---

## 最佳实践

### 1. 用 `@layer base` 管理组件基础样式

```css
@layer base {
  button {
    @apply bg-primary text-primary-fg px-md py-sm rounded-md;
  }
  
  input {
    @apply bg-input text-fg border border-border rounded-md px-sm py-xs;
  }
  
  h1 { @apply text-3xl font-bold; }
  h2 { @apply text-2xl font-semibold; }
  h3 { @apply text-xl font-semibold; }
}
```

### 2. 组件变体使用 CVA

```tsx
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-fast",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-fg hover:bg-secondary/80",
        ghost: "bg-transparent hover:bg-bg-muted",
        destructive: "bg-destructive text-destructive-fg hover:bg-destructive/90",
      },
      size: {
        sm: " px-sm text-sm",
        md: "h-size-md px-md text-base",
        lg: "h-size-lg px-lg text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);
```

### 3. 避免使用任意值

```tsx
// ❌ 避免
<div className="p-[13px] rounded-[7px] bg-[#f5f5f5]">

// ✅ 推荐
<div className="p-sm rounded-md bg-bg-muted">
```

### 4. 主题切换自动生效

当使用 Token 时，主题切换只需更改 CSS 变量：

```tsx
// 切换主题
document.documentElement.setAttribute('data-theme', 'ocean');
document.documentElement.classList.toggle('dark');

// UI 自动更新 - 无需修改任何组件代码
```

---

## 附录：Token 速查表

### 颜色

```
bg-bg           bg-bg-elevated    bg-bg-muted      bg-bg-popover
text-fg         text-fg-muted     text-fg-card     text-fg-popover
bg-primary      text-primary-fg   bg-secondary     text-secondary-fg
bg-accent       text-accent-fg    bg-destructive   text-destructive-fg
border-border   bg-input          ring-ring
```

### 间距

```
p-xs (4px)    p-sm (8px)    p-md (16px)   p-lg (24px)   p-xl (32px)
m-xs          m-sm          m-md          m-lg          m-xl
gap-xs        gap-sm        gap-md        gap-lg        gap-xl
```

### 圆角

```
rounded-none  rounded-sm    rounded-md    rounded-lg    rounded-xl    rounded-full
```

### 阴影

```
shadow-xs     shadow-sm     shadow-md     shadow-lg     shadow-xl     shadow-2xl
```

### 字体

```
text-xs (11px)  text-sm (12px)  text-base (14px)  text-lg (16px)  text-xl (20px)
font-normal     font-medium     font-semibold     font-bold
```

---

---

## 已完成的组件 Token 化

| 组件 | 更改 |
|------|------|
| `button.tsx` | `h-6` → `h-size-xs`, `h-10` → `h-size-lg`, `size-7` → `size-sm` |
| `input.tsx` | `h-7` → ``, `px-2` → `px-sm` |
| `dialog.tsx` | `right-4 top-4` → `right-md top-md`, `p-1` → `p-xs`, `h-4 w-4` → `size-icon-md` |
| `popover.tsx` | 使用 `popover-content` CSS 类 |
| `select.tsx` | `h-4 w-4` → `size-icon-md`, `py-1.5` → `py-xs`, `pl-8 pr-2` → `pl-8 pr-sm` |
| `dropdown.tsx` | `h-7` → ``, `py-2` → `py-sm`, `py-1.5` → `py-xs`, 图标使用 `size-icon-*` |
| `sheet.tsx` | `right-4 top-4` → `right-md top-md`, `h-4 w-4` → `size-icon-md` |
| `components.css` | 全面使用 `p-sm`, `p-md`, `p-lg`, `gap-sm`, `` 等 Token |

### 新增 Token

```css
/* 间距 Token */
--spacing-xs: 0.25rem;    /* 4px */
--spacing-sm: 0.5rem;     /* 8px */
--spacing-md: 1rem;       /* 16px */
--spacing-lg: 1.5rem;     /* 24px */
--spacing-xl: 2rem;       /* 32px */

/* 尺寸 Token */
--size-xs: 1.5rem;        /* 24px */
--size-sm: 1.75rem;       /* 28px */
--size-md: 2rem;          /* 32px */
--size-lg: 2.5rem;        /* 40px */
--size-xl: 3rem;          /* 48px */

/* 图标尺寸 Token */
--icon-xs: 0.75rem;       /* 12px */
--icon-sm: 0.875rem;      /* 14px */
--icon-md: 1rem;          /* 16px */
--icon-lg: 1.25rem;       /* 20px */
--icon-xl: 1.5rem;        /* 24px */
```

### 新增 CSS 组件类

```css
/* 通用组件类 */
.card              /* 卡片容器 */
.list-item         /* 列表项 */
.list-item-active  /* 激活的列表项 */
.section-header    /* 分组标题 */
.icon-btn          /* 图标按钮 */
.icon-btn-sm       /* 小图标按钮 */
```

---

*文档版本: 1.2.0*
*最后更新: 2024-12*
