/**
 * 缓存服务基类
 * 提供统一的初始化、缓存、CRUD 操作模式
 */

export type ServiceState = "idle" | "loading" | "ready" | "error";

/**
 * 缓存服务基类
 * @template TRecord 记录类型（必须包含 id 字段）
 * @template TInsert 插入类型
 */
export abstract class CachingService<
  TRecord extends { id: string },
  TInsert = Partial<TRecord>
> {
  protected cache = new Map<string, TRecord>();
  protected state: ServiceState = "idle";
  protected initPromise: Promise<void> | null = null;

  constructor(protected readonly serviceName: string) {}

  // ==================== 抽象方法（子类实现） ====================

  /**
   * 从数据库加载所有记录
   */
  protected abstract loadAll(): Promise<TRecord[]>;

  /**
   * 插入记录到数据库
   */
  protected abstract insertRecord(payload: TInsert): Promise<TRecord>;

  /**
   * 更新数据库中的记录
   */
  protected abstract updateRecord(
    id: string,
    changes: Partial<TInsert>
  ): Promise<TRecord>;

  /**
   * 从数据库删除记录
   */
  protected abstract deleteRecord(id: string): Promise<void>;

  // ==================== 生命周期 ====================

  /**
   * 初始化服务
   */
  async init(): Promise<void> {
    if (this.state === "ready") return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    try {
      this.state = "loading";
      const records = await this.loadAll();
      this.cache = new Map(records.map((r) => [r.id, r]));
      this.state = "ready";
      console.log(
        `[${this.serviceName}] Loaded ${this.cache.size} records`
      );
    } catch (error) {
      this.state = "error";
      console.error(`[${this.serviceName}] Init failed:`, error);
      throw error;
    } finally {
      this.initPromise = null;
    }
  }

  /**
   * 确保服务已初始化
   */
  protected async ensureReady(): Promise<void> {
    if (this.state !== "ready") {
      await this.init();
    }
  }

  /**
   * 刷新缓存
   */
  async refresh(): Promise<void> {
    this.state = "idle";
    await this.init();
  }

  /**
   * 获取服务状态
   */
  getState(): ServiceState {
    return this.state;
  }

  // ==================== 读取操作（同步） ====================

  /**
   * 获取所有记录
   */
  list(): TRecord[] {
    return Array.from(this.cache.values());
  }

  /**
   * 根据 ID 获取记录
   */
  get(id: string): TRecord | null {
    return this.cache.get(id) ?? null;
  }

  /**
   * 检查记录是否存在
   */
  has(id: string): boolean {
    return this.cache.has(id);
  }

  /**
   * 获取记录数量
   */
  count(): number {
    return this.cache.size;
  }

  // ==================== 写入操作（异步） ====================

  /**
   * 创建记录
   */
  async create(payload: TInsert): Promise<TRecord> {
    await this.ensureReady();
    const record = await this.insertRecord(payload);
    this.cache.set(record.id, record);
    console.log(`[${this.serviceName}] Created: ${record.id}`);
    return record;
  }

  /**
   * 更新记录
   */
  async update(id: string, changes: Partial<TInsert>): Promise<TRecord> {
    await this.ensureReady();
    const record = await this.updateRecord(id, changes);
    this.cache.set(id, record);
    console.log(`[${this.serviceName}] Updated: ${id}`);
    return record;
  }

  /**
   * 删除记录
   */
  async delete(id: string): Promise<void> {
    await this.ensureReady();
    await this.deleteRecord(id);
    this.cache.delete(id);
    console.log(`[${this.serviceName}] Deleted: ${id}`);
  }

  // ==================== 批量操作 ====================

  /**
   * 批量创建
   */
  async createMany(payloads: TInsert[]): Promise<TRecord[]> {
    const records: TRecord[] = [];
    for (const payload of payloads) {
      records.push(await this.create(payload));
    }
    return records;
  }

  /**
   * 批量删除
   */
  async deleteMany(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id);
    }
  }

  // ==================== 查询辅助 ====================

  /**
   * 根据条件筛选
   */
  filter(predicate: (record: TRecord) => boolean): TRecord[] {
    return this.list().filter(predicate);
  }

  /**
   * 查找第一个匹配的记录
   */
  find(predicate: (record: TRecord) => boolean): TRecord | undefined {
    return this.list().find(predicate);
  }
}

