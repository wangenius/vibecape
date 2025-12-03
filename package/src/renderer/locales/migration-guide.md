# 多语言分包迁移指南

## 概述

本次更新将大型多语言文件拆分为按业务域组织的小包，实现按需加载，显著提升首屏加载性能。

## 新架构特点

### 1. 分包结构
```
src/lib/i18n/dictionaries/
├── en/
│   ├── common.json          # 通用组件 (~5KB)
│   ├── home.json           # 首页 (~3KB)
│   ├── auth.json           # 认证 (~4KB)
│   ├── dashboard-common.json # Dashboard通用 (~2KB)
│   ├── dashboard-client.json # 客户端功能 (~25KB)
│   ├── dashboard-vendor.json # 供应商功能 (~8KB)
│   ├── vendor.json         # 供应商专用 (~15KB)
│   └── coins.json          # 积分系统 (~2KB)
└── zh-CN/
    └── (相同结构)
```

### 2. 按需加载
- **首屏只加载**: `common.json` (~5KB)
- **路由切换时**: 动态加载对应命名空间
- **智能预加载**: 后台预加载可能需要的包

### 3. 缓存策略
- 内存缓存已加载的命名空间
- 避免重复网络请求
- 支持热重载（开发环境）

## 迁移步骤

### 1. 更新现有组件

#### 旧方式 (保持兼容)
```typescript
// 仍然可用，但会加载完整字典
import { getDictionary } from '@/lib/i18n/get-dictionary';

export default async function Page({ params: { locale } }) {
  const dict = await getDictionary(locale);
  return <h1>{dict.home.hero.title}</h1>;
}
```

#### 新方式 (推荐)
```typescript
// 按路由自动加载需要的命名空间
import { getDictionary } from '@/lib/i18n/get-dictionary-v2';

export default async function HomePage({ params: { locale } }) {
  // 自动加载 common + home 命名空间
  const dict = await getDictionary(locale, '/');
  return <h1>{dict.home.hero.title}</h1>;
}
```

#### 客户端组件
```typescript
'use client';
import { useLazyTranslation } from '@/lib/i18n/use-lazy-translation';

export default function ClientComponent({ locale, initialDict }) {
  const { dictionary, loading } = useLazyTranslation({
    locale,
    initialDictionary: initialDict
  });
  
  if (loading) return <div>Loading...</div>;
  
  return <h1>{dictionary?.home?.hero?.title}</h1>;
}
```

### 2. 服务端渲染优化

```typescript
// app/[locale]/layout.tsx
import { getDictionary } from '@/lib/i18n/get-dictionary-v2';
import { initializeI18n } from '@/lib/i18n/get-dictionary-v2';

export default async function Layout({ 
  children, 
  params: { locale } 
}) {
  // 初始化预加载
  await initializeI18n(locale);
  
  // 获取布局需要的翻译
  const dict = await getDictionary(locale, '/');
  
  return (
    <html lang={locale}>
      <body>
        <TranslationProvider initialDict={dict} locale={locale}>
          {children}
        </TranslationProvider>
      </body>
    </html>
  );
}
```

### 3. 路由级预加载

```typescript
// app/[locale]/client/page.tsx
import { getDictionary, handleRouteChange } from '@/lib/i18n/get-dictionary-v2';

export default async function ClientPage({ params: { locale } }) {
  // 加载当前页面需要的命名空间
  const dict = await getDictionary(locale, '/client');
  
  // 预加载相关命名空间
  handleRouteChange(locale, '/client');
  
  return <ClientDashboard dict={dict} />;
}
```

## 性能优化建议

### 1. 首屏优化
```typescript
// 只加载关键命名空间
const criticalDict = await getDictionaryForNamespaces(locale, ['common']);
```

### 2. 预加载策略
```typescript
// 在用户可能访问的页面预加载
usePreloadNamespaces(locale, ['dashboard-client', 'coins']);
```

### 3. 错误处理
```typescript
const { dictionary, loading, error, refresh } = useLazyTranslation({
  locale,
  initialDictionary: serverDict
});

if (error) {
  return <div>翻译加载失败 <button onClick={refresh}>重试</button></div>;
}
```

## 开发工具

### 1. 加载统计
```typescript
import { useTranslationStats } from '@/lib/i18n/use-lazy-translation';

function DevTools() {
  const stats = useTranslationStats();
  
  return (
    <div>
      缓存: {stats?.cached} | 加载中: {stats?.loading}
    </div>
  );
}
```

### 2. 手动加载命名空间
```typescript
const { loadNamespaces } = useLazyTranslation({ locale });

// 按需加载特定功能
const handleOpenVendorModal = async () => {
  await loadNamespaces(['vendor']);
  setModalOpen(true);
};
```

## 最佳实践

### 1. 命名空间设计
- 按功能模块拆分，不按页面拆分
- 保持包大小在 5-20KB 之间
- 通用内容放在 `common` 命名空间

### 2. 预加载时机
- 首屏后 100ms 预加载高优先级包
- 用户交互时预加载相关功能包
- 路由切换时预加载目标页面包

### 3. 错误处理
- 提供降级方案（使用缓存或默认文本）
- 实现重试机制
- 记录加载失败的统计信息

## 兼容性说明

- 旧的 `getDictionary` 函数仍然可用
- 现有组件无需立即迁移
- 新功能建议使用新API
- 逐步迁移，降低风险

## 性能指标

### 优化前
- 首屏翻译文件: ~60KB (gzipped ~15KB)
- 首次加载时间: ~200ms
- 内存占用: ~500KB

### 优化后
- 首屏翻译文件: ~5KB (gzipped ~2KB)
- 首次加载时间: ~50ms
- 内存占用: ~100KB (按需增长)

## 故障排除

### 1. 翻译缺失
检查命名空间是否正确加载：
```typescript
import { getCachedNamespaces } from '@/lib/i18n/lazy-loader';
console.log('已缓存:', getCachedNamespaces(locale));
```

### 2. 加载失败
检查文件路径和网络连接：
```typescript
// 手动测试加载
import { loadNamespace } from '@/lib/i18n/lazy-loader';
try {
  const result = await loadNamespace('en', 'common');
  console.log('加载成功:', result);
} catch (error) {
  console.error('加载失败:', error);
}
```

### 3. 性能问题
使用开发工具监控加载情况：
```typescript
import { getLoadingStats } from '@/lib/i18n/get-dictionary-v2';
console.log('加载统计:', getLoadingStats());
```
