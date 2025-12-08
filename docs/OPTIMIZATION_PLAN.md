# Vibecape 优化方案

本文档详细描述项目的优化空间和具体实施方案。

---

## 目录

1. [安全性优化](#1-安全性优化)
2. [架构优化](#2-架构优化)
3. [性能优化](#3-性能优化)
4. [代码质量优化](#4-代码质量优化)
5. [编辑器模块优化](#5-编辑器模块优化)
6. [构建与配置优化](#6-构建与配置优化)
7. [实施优先级与计划](#7-实施优先级与计划)

---

## 1. 安全性优化

### 1.1 API Key 加密存储

**当前问题**

API Key 以明文形式存储在 SQLite 数据库中：

```typescript
// src/common/schema/app.ts
export const providers = sqliteTable("providers", {
  // ...
  api_key: text("api_key").notNull(),  // 明文存储
});
```

**风险**
- 本地数据库文件可被直接读取
- 用户设备丢失或被入侵时 API Key 泄露
- 不符合安全最佳实践

**优化方案**

使用 Electron 的 `safeStorage` API 进行加密：

```typescript
// src/main/utils/crypto.ts
import { safeStorage } from 'electron';

export function encryptApiKey(apiKey: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(apiKey);
    return encrypted.toString('base64');
  }
  // 开发环境 fallback
  console.warn('[Crypto] Encryption not available, storing in plain text');
  return `plain:${apiKey}`;
}

export function decryptApiKey(stored: string): string {
  if (stored.startsWith('plain:')) {
    return stored.slice(6);
  }
  if (safeStorage.isEncryptionAvailable()) {
    const buffer = Buffer.from(stored, 'base64');
    return safeStorage.decryptString(buffer);
  }
  throw new Error('Cannot decrypt API key: encryption not available');
}
```

**修改 Provider 服务**

```typescript
// src/main/services/Provider.ts
import { encryptApiKey, decryptApiKey } from '../utils/crypto';

static async create(payload: ProviderInsert): Promise<ProviderRecord> {
  // 存储前加密
  const encryptedPayload = {
    ...payload,
    api_key: encryptApiKey(payload.api_key),
  };
  
  const [record] = await appDb.insert(providers).values(encryptedPayload).returning();
  
  // 返回时解密（内存中使用）
  return {
    ...record,
    api_key: decryptApiKey(record.api_key),
  };
}
```

---

### 1.2 协议路径验证

**当前问题**

`local-asset` 协议没有验证文件路径：

```typescript
// src/main/index.ts
protocol.handle("local-asset", (request) => {
  const filePath = decodeURIComponent(request.url.replace("local-asset://", ""));
  return net.fetch(pathToFileURL(filePath).href);  // 直接访问任意路径
});
```

**风险**
- 路径遍历攻击：`local-asset://../../../etc/passwd`
- 敏感文件泄露

**优化方案**

```typescript
// src/main/index.ts
import path from 'path';
import { getDocsRoot, getUserDataPaths } from './services/UserData';

protocol.handle("local-asset", (request) => {
  const filePath = decodeURIComponent(request.url.replace("local-asset://", ""));
  const normalizedPath = path.normalize(filePath);
  
  // 允许访问的目录白名单
  const allowedDirs = [
    getDocsRoot(),
    getUserDataPaths().vibecapeDir,
  ].filter(Boolean);
  
  // 验证路径在白名单内
  const isAllowed = allowedDirs.some(dir => 
    normalizedPath.startsWith(path.normalize(dir) + path.sep)
  );
  
  if (!isAllowed) {
    console.warn(`[Protocol] Blocked access to: ${normalizedPath}`);
    return new Response('Forbidden', { status: 403 });
  }
  
  return net.fetch(pathToFileURL(normalizedPath).href);
});
```

---

### 1.3 数据库迁移策略

**当前问题**

运行时直接执行 DDL 语句，没有版本控制：

```typescript
// src/main/db/ensure-schema.ts
const sqls = [
  `CREATE TABLE IF NOT EXISTS providers (...)`,
  `ALTER TABLE models DROP COLUMN api_key;`,  // 危险！
];
```

**风险**
- 多次执行 DROP COLUMN 可能报错
- 无法追踪迁移历史
- 回滚困难

**优化方案**

```typescript
// src/main/db/migrations.ts
interface Migration {
  version: number;
  name: string;
  up: string;
  down?: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_initial_tables',
    up: `
      CREATE TABLE IF NOT EXISTS providers (...);
      CREATE TABLE IF NOT EXISTS models (...);
      CREATE TABLE IF NOT EXISTS settings (...);
    `,
  },
  {
    version: 2,
    name: 'remove_model_credentials',
    up: `
      -- SQLite 不支持 DROP COLUMN，需要重建表
      CREATE TABLE models_new AS SELECT id, name, description, model, provider_id, type, json, reasoner FROM models;
      DROP TABLE models;
      ALTER TABLE models_new RENAME TO models;
    `,
    down: `
      ALTER TABLE models ADD COLUMN api_key TEXT DEFAULT '';
      ALTER TABLE models ADD COLUMN base_url TEXT DEFAULT '';
    `,
  },
];

export async function runMigrations(client: Client): Promise<void> {
  // 创建迁移记录表
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `);
  
  // 获取已执行的迁移
  const applied = await client.execute('SELECT version FROM _migrations');
  const appliedVersions = new Set(applied.rows.map(r => r.version as number));
  
  // 执行未应用的迁移
  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) continue;
    
    console.log(`[Migration] Running: ${migration.version} - ${migration.name}`);
    
    await client.execute(migration.up);
    await client.execute(
      'INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)',
      [migration.version, migration.name, Date.now()]
    );
  }
}
```

---

## 2. 架构优化

### 2.1 服务层抽象

**当前问题**

`Model` 和 `Provider` 服务有大量重复代码：

```typescript
// 两个服务都有相同的模式
private static cache = new Map();
private static initialized = false;
private static initPromise = null;

static async init() { ... }
static async ensureInit() { ... }
static list() { ... }
static get(id) { ... }
```

**优化方案**

提取通用缓存服务基类：

```typescript
// src/main/services/base/CachingService.ts
import type { LibSQLDatabase } from 'drizzle-orm/libsql';

export abstract class CachingService<
  TRecord extends { id: string },
  TInsert
> {
  protected cache = new Map<string, TRecord>();
  protected state: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  protected initPromise: Promise<void> | null = null;

  constructor(
    protected readonly serviceName: string
  ) {}

  protected abstract loadAll(): Promise<TRecord[]>;
  protected abstract insertRecord(payload: TInsert): Promise<TRecord>;
  protected abstract updateRecord(id: string, changes: Partial<TInsert>): Promise<TRecord>;
  protected abstract deleteRecord(id: string): Promise<void>;

  async init(): Promise<void> {
    if (this.state === 'ready') return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    try {
      this.state = 'loading';
      const records = await this.loadAll();
      this.cache = new Map(records.map(r => [r.id, r]));
      this.state = 'ready';
      console.log(`[${this.serviceName}] Loaded ${this.cache.size} records`);
    } catch (error) {
      this.state = 'error';
      console.error(`[${this.serviceName}] Init failed:`, error);
      throw error;
    } finally {
      this.initPromise = null;
    }
  }

  protected async ensureReady(): Promise<void> {
    if (this.state !== 'ready') {
      await this.init();
    }
  }

  list(): TRecord[] {
    return Array.from(this.cache.values());
  }

  get(id: string): TRecord | null {
    return this.cache.get(id) ?? null;
  }

  async create(payload: TInsert): Promise<TRecord> {
    await this.ensureReady();
    const record = await this.insertRecord(payload);
    this.cache.set(record.id, record);
    return record;
  }

  async update(id: string, changes: Partial<TInsert>): Promise<TRecord> {
    await this.ensureReady();
    const record = await this.updateRecord(id, changes);
    this.cache.set(id, record);
    return record;
  }

  async delete(id: string): Promise<void> {
    await this.ensureReady();
    await this.deleteRecord(id);
    this.cache.delete(id);
  }

  async refresh(): Promise<void> {
    this.state = 'idle';
    await this.init();
  }
}
```

**重构后的 Provider 服务**

```typescript
// src/main/services/Provider.ts
import { CachingService } from './base/CachingService';
import { providers, type Provider as ProviderRecord, type ProviderInsert } from '@common/schema/app';
import { appDb } from '../db/app';
import { eq } from 'drizzle-orm';

class ProviderService extends CachingService<ProviderRecord, ProviderInsert> {
  constructor() {
    super('Provider');
  }

  protected async loadAll(): Promise<ProviderRecord[]> {
    return appDb.select().from(providers);
  }

  protected async insertRecord(payload: ProviderInsert): Promise<ProviderRecord> {
    this.validate(payload);
    const [record] = await appDb.insert(providers).values(payload).returning();
    return record;
  }

  protected async updateRecord(id: string, changes: Partial<ProviderInsert>): Promise<ProviderRecord> {
    const [record] = await appDb
      .update(providers)
      .set(changes)
      .where(eq(providers.id, id))
      .returning();
    if (!record) throw new Error(`Provider ${id} not found`);
    return record;
  }

  protected async deleteRecord(id: string): Promise<void> {
    await appDb.delete(providers).where(eq(providers.id, id));
  }

  private validate(payload: ProviderInsert): void {
    if (!payload.name?.trim()) throw new Error('Provider name required');
    if (!payload.base_url?.trim()) throw new Error('Base URL required');
    if (!payload.api_key?.trim()) throw new Error('API Key required');
  }

  // Provider 特有方法
  async fetchRemoteModels(providerId: string): Promise<RemoteModel[]> {
    const provider = this.get(providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);
    // ... 实现
  }
}

export const Provider = new ProviderService();
```

---

### 2.2 IPC Handler 显式注册

**当前问题**

副作用导入难以追踪：

```typescript
// src/main/index.ts
import "./handler/app/SettingsHandler";  // 副作用导入
```

**优化方案**

```typescript
// src/main/handler/index.ts
import { ipcMain } from 'electron';
import { registerSettingsHandlers } from './app/SettingsHandler';
import { registerModelHandlers } from './app/ModelHandler';
import { registerProviderHandlers } from './app/ProviderHandler';
import { registerChatHandlers } from './chat/ChatHandler';
import { registerDocsHandlers } from './docs/VibecapeHandler';

export function registerAllHandlers(): void {
  console.log('[IPC] Registering handlers...');
  
  registerSettingsHandlers(ipcMain);
  registerModelHandlers(ipcMain);
  registerProviderHandlers(ipcMain);
  registerChatHandlers(ipcMain);
  registerDocsHandlers(ipcMain);
  
  console.log('[IPC] All handlers registered');
}
```

**Handler 改造示例**

```typescript
// src/main/handler/app/SettingsHandler.ts
import type { IpcMain } from 'electron';
import { SettingsService } from '../../services/Settings';

export function registerSettingsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('settings:get', async () => {
    return SettingsService.get();
  });

  ipcMain.handle('settings:update', async (_, path, value) => {
    return SettingsService.update(path, value);
  });
}
```

**主进程入口**

```typescript
// src/main/index.ts
import { registerAllHandlers } from './handler';

app.whenReady().then(async () => {
  await ensureDatabaseReady();
  await initServices();
  
  registerAllHandlers();  // 显式注册
  
  createWindow();
});
```

---

### 2.3 引入 Repository 层

**当前问题**

Service 层直接操作 Drizzle ORM，耦合度高：

```typescript
// DocsService 直接使用 Drizzle
const allDocs = await db.select().from(docs).orderBy(asc(docs.order));
```

**优化方案**

```
Handler → Service → Repository → Database
```

```typescript
// src/main/repositories/DocsRepository.ts
import { eq, isNull, asc } from 'drizzle-orm';
import { docs, type Doc } from '@common/schema/docs';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';

export class DocsRepository {
  constructor(private db: LibSQLDatabase<any>) {}

  async findAll(): Promise<Doc[]> {
    return this.db.select().from(docs).orderBy(asc(docs.order));
  }

  async findById(id: string): Promise<Doc | null> {
    const [doc] = await this.db.select().from(docs).where(eq(docs.id, id)).limit(1);
    return doc ?? null;
  }

  async findByParent(parentId: string | null): Promise<Doc[]> {
    const condition = parentId ? eq(docs.parent_id, parentId) : isNull(docs.parent_id);
    return this.db.select().from(docs).where(condition).orderBy(asc(docs.order));
  }

  async create(data: Omit<Doc, 'id' | 'created_at' | 'updated_at'>): Promise<Doc> {
    const now = Date.now();
    const [doc] = await this.db.insert(docs).values({
      ...data,
      created_at: now,
      updated_at: now,
    }).returning();
    return doc;
  }

  async update(id: string, data: Partial<Doc>): Promise<Doc | null> {
    const [doc] = await this.db
      .update(docs)
      .set({ ...data, updated_at: Date.now() })
      .where(eq(docs.id, id))
      .returning();
    return doc ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(docs).where(eq(docs.id, id));
  }

  async updateOrder(updates: { id: string; order: number }[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await Promise.all(
        updates.map(({ id, order }) =>
          tx.update(docs).set({ order }).where(eq(docs.id, id))
        )
      );
    });
  }
}
```

---

## 3. 性能优化

### 3.1 批量数据库操作

**当前问题**

文档重排序逐条更新：

```typescript
for (let i = 0; i < siblings.length; i++) {
  await db.update(docs).set({ order: i }).where(eq(docs.id, siblings[i].id));
}
```

**优化方案**

使用事务批量更新：

```typescript
// 使用 Repository 的批量更新
async reorderDoc(activeId: string, overId: string): Promise<void> {
  const repo = await this.getRepository();
  
  const [activeDoc, overDoc] = await Promise.all([
    repo.findById(activeId),
    repo.findById(overId),
  ]);
  
  if (!activeDoc || !overDoc) throw new Error('Document not found');
  if (activeDoc.parent_id !== overDoc.parent_id) throw new Error('Cannot reorder across parents');
  
  const siblings = await repo.findByParent(activeDoc.parent_id);
  
  // 计算新顺序
  const activeIndex = siblings.findIndex(d => d.id === activeId);
  const overIndex = siblings.findIndex(d => d.id === overId);
  const [removed] = siblings.splice(activeIndex, 1);
  siblings.splice(overIndex, 0, removed);
  
  // 批量更新
  const updates = siblings.map((doc, i) => ({ id: doc.id, order: i }));
  await repo.updateOrder(updates);
}
```

---

### 3.2 递归删除优化

**当前问题**

递归获取子文档效率低：

```typescript
const getDescendants = async (parentId: string): Promise<string[]> => {
  const children = await db.select({ id: docs.id }).from(docs).where(eq(docs.parent_id, parentId));
  for (const child of children) {
    ids.push(...(await getDescendants(child.id)));  // N+1 查询
  }
};
```

**优化方案**

使用 SQLite CTE 递归查询：

```typescript
async deleteWithDescendants(id: string): Promise<void> {
  const db = await this.getDb();
  
  // 使用 CTE 一次性获取所有后代
  const result = await db.execute(sql`
    WITH RECURSIVE descendants(id) AS (
      SELECT id FROM ${docs} WHERE id = ${id}
      UNION ALL
      SELECT d.id FROM ${docs} d
      INNER JOIN descendants ON d.parent_id = descendants.id
    )
    SELECT id FROM descendants
  `);
  
  const ids = result.rows.map(r => r.id as string);
  
  // 批量删除
  if (ids.length > 0) {
    await db.delete(docs).where(inArray(docs.id, ids));
  }
}
```

---

### 3.3 流式服务内存管理

**当前问题**

没有清理机制，流异常终止可能导致内存泄漏：

```typescript
private activeStreams = new Map<string, StreamState>();
```

**优化方案**

```typescript
// src/main/services/ChatStream.ts
class ChatStreamService {
  private activeStreams = new Map<string, StreamState>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  private readonly STREAM_TIMEOUT = 30 * 60 * 1000;  // 30 分钟
  private readonly CLEANUP_INTERVAL = 60 * 1000;     // 1 分钟

  constructor() {
    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleStreams();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanupStaleStreams(): void {
    const now = Date.now();
    const staleIds: string[] = [];

    for (const [id, state] of this.activeStreams) {
      if (now - state.startTime > this.STREAM_TIMEOUT) {
        staleIds.push(id);
      }
    }

    for (const id of staleIds) {
      console.warn(`[ChatStream] Cleaning up stale stream: ${id}`);
      this.cancelStream(id).catch(console.error);
    }

    if (staleIds.length > 0) {
      console.log(`[ChatStream] Cleaned up ${staleIds.length} stale streams`);
    }
  }

  // 在流状态中添加开始时间
  async handleStreamResponse(...) {
    const state: StreamState = {
      abortController,
      threadId,
      parts: [],
      currentText: "",
      currentReasoning: "",
      startTime: Date.now(),  // 添加
    };
    // ...
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    // 取消所有活跃流
    for (const id of this.activeStreams.keys()) {
      this.cancelStream(id).catch(console.error);
    }
  }
}
```

---

## 4. 代码质量优化

### 4.1 类型安全增强

**当前问题**

部分地方使用类型断言：

```typescript
const toolName = (chunk as { toolName?: string }).toolName || "unknown";
```

**优化方案**

定义明确的类型守卫：

```typescript
// src/main/services/types/stream.ts
import type { TextDeltaChunk, ToolCallChunk, ToolResultChunk } from 'ai';

export interface StreamChunk {
  type: string;
}

export interface TextDeltaStreamChunk extends StreamChunk {
  type: 'text-delta';
  text: string;
}

export interface ReasoningDeltaStreamChunk extends StreamChunk {
  type: 'reasoning-delta';
  text: string;
}

export interface ToolCallStreamChunk extends StreamChunk {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  input: unknown;
}

export interface ToolResultStreamChunk extends StreamChunk {
  type: 'tool-result';
  toolCallId: string;
  output: unknown;
}

// 类型守卫
export function isTextDelta(chunk: StreamChunk): chunk is TextDeltaStreamChunk {
  return chunk.type === 'text-delta';
}

export function isReasoningDelta(chunk: StreamChunk): chunk is ReasoningDeltaStreamChunk {
  return chunk.type === 'reasoning-delta';
}

export function isToolCall(chunk: StreamChunk): chunk is ToolCallStreamChunk {
  return chunk.type === 'tool-call';
}

export function isToolResult(chunk: StreamChunk): chunk is ToolResultStreamChunk {
  return chunk.type === 'tool-result';
}
```

**使用示例**

```typescript
onChunk: ({ chunk }) => {
  if (isTextDelta(chunk)) {
    state.currentText += chunk.text;
    process.stdout.write(chunk.text);
  } else if (isReasoningDelta(chunk)) {
    state.currentReasoning += chunk.text;
  } else if (isToolCall(chunk)) {
    const { toolName, input, toolCallId } = chunk;
    console.log(`Tool Call: ${toolName}`);
    // ...
  } else if (isToolResult(chunk)) {
    const { toolCallId, output } = chunk;
    // ...
  }
}
```

---

### 4.2 错误处理统一

**当前问题**

错误处理方式不一致：

```typescript
// 有些抛出错误
throw new Error('Provider not found');

// 有些返回 null
return null;

// 有些只打印日志
console.error('Failed to load', error);
```

**优化方案**

使用 Result 模式：

```typescript
// src/common/lib/result.ts
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const ok = <T>(data: T): Result<T, never> => ({ success: true, data });
export const err = <E>(error: E): Result<never, E> => ({ success: false, error });

// 工具函数
export function unwrap<T>(result: Result<T>): T {
  if (result.success) return result.data;
  throw result.error;
}

export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  return result.success ? result.data : defaultValue;
}
```

**使用示例**

```typescript
// src/main/services/Docs.ts
import { Result, ok, err } from '@common/lib/result';

export class DocsService {
  static async getDoc(id: string): Promise<Result<DocData, string>> {
    try {
      const db = await this.getDb();
      const [doc] = await db.select().from(docs).where(eq(docs.id, id)).limit(1);
      
      if (!doc) {
        return err(`Document not found: ${id}`);
      }
      
      return ok({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        // ...
      });
    } catch (error) {
      return err(`Failed to get document: ${(error as Error).message}`);
    }
  }
}
```

---

### 4.3 日志系统规范化

**当前问题**

日志格式不统一：

```typescript
console.log("[Model] 已加载 ${this.models.size} 个模型配置");
console.error("[Provider] 获取远程模型失败:", error);
```

**优化方案**

```typescript
// src/main/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

class Logger {
  constructor(private module: string) {}

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      module: this.module,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${this.module}]`;
    const formatted = data 
      ? `${prefix} ${message} ${JSON.stringify(data)}`
      : `${prefix} ${message}`;

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, data);
  }
}

export function createLogger(module: string): Logger {
  return new Logger(module);
}
```

**使用示例**

```typescript
// src/main/services/Model.ts
import { createLogger } from '../utils/logger';

const log = createLogger('Model');

export class Model {
  static async init(): Promise<void> {
    log.info('Initializing model service');
    
    try {
      const models = await this.loadAll();
      log.info('Models loaded', { count: models.length });
    } catch (error) {
      log.error('Failed to initialize', { error: (error as Error).message });
      throw error;
    }
  }
}
```

---

## 5. 编辑器模块优化

### 5.1 扩展目录重组

**当前结构**

```
extensions/
├── AIDiffMark.ts
├── AIDiffNode.tsx
├── AIRewriteNode.tsx
├── Admonition.tsx
├── CodeBlockNode.tsx
├── ... (19 files)
```

**优化后结构**

```
extensions/
├── ai/                    # AI 功能扩展
│   ├── AIDiffMark.ts      # Diff 标记
│   ├── AIDiffNode.tsx     # Diff 块级节点
│   ├── AIRewriteNode.tsx  # 重写节点
│   ├── PredictNode.tsx    # 预测补全
│   └── index.ts
│
├── blocks/                # 块级节点
│   ├── Admonition.tsx
│   ├── AdmonitionExtension.tsx
│   ├── Blockquote.ts
│   ├── CodeBlockNode.tsx
│   ├── ImageNode.tsx
│   ├── TableExtension.ts
│   └── index.ts
│
├── inline/                # 行内元素
│   ├── InlineCode.ts
│   ├── LinkNode.tsx
│   ├── Mention.tsx
│   ├── MentionNode.tsx
│   ├── MentionExtension.ts
│   ├── MentionCommand.ts
│   └── index.ts
│
├── interaction/           # 交互功能
│   ├── CustomKeyboardExtension.ts
│   ├── MarkdownPasteExtension.ts
│   ├── SlashCommand.ts
│   └── index.ts
│
└── index.ts               # 统一导出
```

---

### 5.2 扩展配置抽离

**当前问题**

扩展配置散落在各处：

```typescript
// DocEditor.tsx
const extensions = [
  StarterKit.configure({
    codeBlock: false,
    blockquote: false,
    // ...
  }),
  Placeholder.configure({ ... }),
  // ... 20+ 扩展配置
];
```

**优化方案**

```typescript
// src/renderer/components/editor/config/extensions.ts
import { Extension } from '@tiptap/core';

export interface EditorConfig {
  ai: {
    enabled: boolean;
    rewrite: boolean;
    predict: boolean;
    diff: boolean;
  };
  blocks: {
    codeBlock: boolean;
    image: boolean;
    table: boolean;
    admonition: boolean;
  };
  inline: {
    link: boolean;
    mention: boolean;
  };
  interaction: {
    slashCommand: boolean;
    markdownPaste: boolean;
  };
}

export const defaultConfig: EditorConfig = {
  ai: { enabled: true, rewrite: true, predict: true, diff: true },
  blocks: { codeBlock: true, image: true, table: true, admonition: true },
  inline: { link: true, mention: true },
  interaction: { slashCommand: true, markdownPaste: true },
};

export function createExtensions(config: Partial<EditorConfig> = {}): Extension[] {
  const merged = { ...defaultConfig, ...config };
  const extensions: Extension[] = [];

  // 基础扩展
  extensions.push(StarterKit.configure({
    codeBlock: false,
    blockquote: false,
  }));

  // AI 扩展
  if (merged.ai.enabled) {
    if (merged.ai.rewrite) extensions.push(AIRewriteNode);
    if (merged.ai.predict) extensions.push(PredictNode);
    if (merged.ai.diff) {
      extensions.push(AIDiffMark);
      extensions.push(AIDiffNode);
    }
  }

  // 块级扩展
  if (merged.blocks.codeBlock) extensions.push(CodeBlockNode);
  if (merged.blocks.image) extensions.push(ImageNode);
  if (merged.blocks.table) extensions.push(TableExtension);
  if (merged.blocks.admonition) extensions.push(AdmonitionExtension);

  // ... 其他

  return extensions;
}
```

---

## 6. 构建与配置优化

### 6.1 项目命名统一

**问题**

```json
// package.json
"name": "jezzlab"

// electron-builder.yml
productName: "jezzlab"
```

但实际目录和代码使用 `vibecape`。

**优化方案**

统一使用 `vibecape`：

```json
// package.json
{
  "name": "vibecape",
  "productName": "Vibecape",
  "description": "AI-powered writing assistant"
}
```

```yaml
# electron-builder.yml
appId: com.vibecape.app
productName: "Vibecape"
```

---

### 6.2 electron-builder 配置完善

```yaml
# electron-builder.yml
appId: com.vibecape.app
productName: "Vibecape"
electronVersion: "38.1.2"

directories:
  buildResources: build
  output: dist

files:
  - "!**/.vscode/*"
  - "!src/*"
  - "!{.eslintcache,eslint.config.mjs}"
  - "!{tsconfig.json,tsconfig.node.json,tsconfig.web.json}"

asarUnpack:
  - resources/**

mac:
  category: public.app-category.productivity
  icon: build/icon.icns
  hardenedRuntime: true
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  extendInfo:
    NSCameraUsageDescription: "用于视频通话功能"
    NSMicrophoneUsageDescription: "用于语音输入功能"
    NSDocumentsFolderUsageDescription: "用于访问文档文件"
  # 发布时启用公证
  # notarize:
  #   teamId: YOUR_TEAM_ID

win:
  icon: build/icon.ico
  target:
    - nsis
    - portable

linux:
  icon: build/icons
  target:
    - AppImage
    - deb
  category: Office

publish:
  provider: github
  owner: your-org
  repo: vibecape
  releaseType: release
```

---

### 6.3 依赖优化

**移动到 devDependencies**

```json
{
  "devDependencies": {
    "@types/uuid": "^10.0.0"
  }
}
```

**检查未使用依赖**

```bash
npx depcheck
```

---

## 7. 实施优先级与计划

### 阶段一：安全修复 (1-2 周)

| 任务 | 优先级 | 预估工时 |
|------|--------|---------|
| API Key 加密存储 | P0 | 4h |
| 协议路径验证 | P0 | 2h |
| 数据库迁移策略 | P1 | 8h |

### 阶段二：架构重构 (2-4 周)

| 任务 | 优先级 | 预估工时 |
|------|--------|---------|
| 服务层基类提取 | P1 | 8h |
| IPC Handler 重构 | P1 | 4h |
| Repository 层引入 | P2 | 16h |

### 阶段三：性能优化 (1-2 周)

| 任务 | 优先级 | 预估工时 |
|------|--------|---------|
| 批量数据库操作 | P1 | 4h |
| 递归删除优化 | P2 | 4h |
| 流式服务内存管理 | P1 | 4h |

### 阶段四：代码质量 (持续)

| 任务 | 优先级 | 预估工时 |
|------|--------|---------|
| 类型安全增强 | P2 | 8h |
| 错误处理统一 | P2 | 8h |
| 日志系统规范化 | P3 | 4h |
| 编辑器模块重组 | P3 | 8h |
| 构建配置完善 | P3 | 2h |

---

## 总结

本优化方案覆盖了安全、架构、性能、代码质量四个维度，建议按照优先级分阶段实施。

核心原则：
1. **安全优先**：API Key 加密、路径验证必须首先处理
2. **渐进重构**：架构调整分步进行，避免大规模破坏
3. **保持稳定**：每个阶段完成后充分测试
4. **持续改进**：代码质量优化作为长期任务

---

*文档版本: 1.0*
*更新时间: 2024*
