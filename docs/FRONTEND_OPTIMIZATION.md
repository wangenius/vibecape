# 前端架构优化方案

## 一、优化后的目录结构

```
package/src/renderer/
├── @styles/              # 样式
├── App.tsx
├── main.tsx
│
├── assets/               # 静态资源
├── locales/              # 国际化
│
├── lib/                  # 基础工具层
│   ├── client.ts
│   ├── tools.ts
│   └── utils.ts
│
├── shared/               # 共享 UI 层
│   ├── ui/               # UI 组件库
│   │   ├── core/
│   │   ├── display/
│   │   ├── feedback/
│   │   └── navigation/
│   ├── hooks/
│   └── utils/
│
├── hook/                 # 业务 Hooks 层
│   ├── stores/           # ✅ Zustand Stores (已拆分)
│   │   ├── useWorkspaceStore.ts
│   │   ├── useDocumentStore.ts
│   │   ├── useUIStore.ts
│   │   └── index.ts
│   ├── model/
│   ├── chat/
│   ├── shortcuts/
│   └── app/
│
├── features/             # 功能模块层
│   ├── ai/
│   ├── chat/
│   ├── docs/
│   ├── editor/
│   └── settings/
│
└── layouts/              # 布局层
    ├── components/       # ✅ 全局组件 (已迁移)
    │   ├── Header.tsx
    │   ├── sidebar/
    │   └── workspace/
    ├── MainLayout.tsx
    └── WorkspaceLayout.tsx
```

---

## 二、Store 职责划分

| Store               | 状态                                      | 方法                                                |
| ------------------- | ----------------------------------------- | --------------------------------------------------- |
| `useWorkspaceStore` | workspace, workspaceList, docsRoot        | createWorkspace, openWorkspace, deleteWorkspace     |
| `useDocumentStore`  | tree, activeDocId, activeDoc              | refreshTree, openDoc, saveDoc, createDoc, deleteDoc |
| `useUIStore`        | loading, listLoading, initProgress, error | setLoading, setError                                |

---

## 三、依赖层级

```
lib/ → shared/ → hook/ → features/ → layouts/
```

| 模块        | 可依赖                     |
| ----------- | -------------------------- |
| `lib/`      | 无依赖                     |
| `shared/`   | `lib/`                     |
| `hook/`     | `shared/`, `lib/`          |
| `features/` | `shared/`, `hook/`, `lib/` |
| `layouts/`  | 全部                       |

---

## 四、使用方式

```typescript
// 导入 stores
import {
  useWorkspaceStore,
  useDocumentStore,
  useUIStore,
  bootstrap,
} from "@/hooks/stores";

// 使用示例
const workspace = useWorkspaceStore((state) => state.workspace);
const activeDoc = useDocumentStore((state) => state.activeDoc);
const loading = useUIStore((state) => state.loading);

// 初始化
useEffect(() => {
  bootstrap();
}, []);
```

---

_更新时间：2025-12-05_
