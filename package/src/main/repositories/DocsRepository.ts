/**
 * 文档 Repository
 * 封装 Drizzle ORM 数据访问操作
 */

import { eq, isNull, asc, inArray, sql } from "drizzle-orm";
import { docs, type Doc, type DocInsert } from "@common/schema/docs";
import type { JSONContent } from "@tiptap/core";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

// 使用泛型类型来兼容不同的 schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DocsDb = LibSQLDatabase<any>;

export class DocsRepository {
  constructor(private db: DocsDb) {}

  // ==================== 查询操作 ====================

  /**
   * 获取所有文档，按 order 排序
   */
  async findAll(): Promise<Doc[]> {
    return this.db.select().from(docs).orderBy(asc(docs.order));
  }

  /**
   * 根据 ID 查找文档
   */
  async findById(id: string): Promise<Doc | null> {
    const [doc] = await this.db
      .select()
      .from(docs)
      .where(eq(docs.id, id))
      .limit(1);
    return doc ?? null;
  }

  /**
   * 获取指定父级下的子文档
   */
  async findByParent(parentId: string | null): Promise<Doc[]> {
    const condition = parentId
      ? eq(docs.parent_id, parentId)
      : isNull(docs.parent_id);
    return this.db.select().from(docs).where(condition).orderBy(asc(docs.order));
  }

  /**
   * 获取指定父级下最大的 order 值
   */
  async getMaxOrder(parentId: string | null): Promise<number> {
    const siblings = await this.findByParent(parentId);
    return siblings.length > 0 ? siblings[siblings.length - 1].order : -1;
  }

  /**
   * 使用 CTE 递归查询获取文档及其所有后代的 ID
   */
  async findDescendantIds(id: string): Promise<string[]> {
    const result = await this.db.all<{ id: string }>(sql`
      WITH RECURSIVE descendants(id) AS (
        SELECT id FROM ${docs} WHERE id = ${id}
        UNION ALL
        SELECT d.id FROM ${docs} d
        INNER JOIN descendants ON d.parent_id = descendants.id
      )
      SELECT id FROM descendants
    `);
    return result.map((r) => r.id);
  }

  // ==================== 创建操作 ====================

  /**
   * 创建文档
   */
  async create(data: {
    parent_id?: string | null;
    title: string;
    content?: JSONContent;
    metadata?: Record<string, unknown>;
    order: number;
  }): Promise<Doc> {
    const now = Date.now();
    const [doc] = await this.db
      .insert(docs)
      .values({
        parent_id: data.parent_id ?? null,
        title: data.title,
        content: data.content || { type: "doc", content: [{ type: "paragraph" }] },
        metadata: data.metadata || {},
        order: data.order,
        created_at: now,
        updated_at: now,
      } as DocInsert)
      .returning();
    return doc;
  }

  // ==================== 更新操作 ====================

  /**
   * 更新文档
   */
  async update(
    id: string,
    data: Partial<{
      title: string;
      content: JSONContent;
      metadata: Record<string, unknown>;
      parent_id: string | null;
      order: number;
    }>
  ): Promise<Doc | null> {
    const [doc] = await this.db
      .update(docs)
      .set({
        ...data,
        updated_at: Date.now(),
      })
      .where(eq(docs.id, id))
      .returning();
    return doc ?? null;
  }

  /**
   * 批量更新文档顺序（使用事务）
   */
  async updateOrderBatch(updates: { id: string; order: number }[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await Promise.all(
        updates.map(({ id, order }) =>
          tx.update(docs).set({ order }).where(eq(docs.id, id))
        )
      );
    });
  }

  // ==================== 删除操作 ====================

  /**
   * 删除单个文档
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(docs).where(eq(docs.id, id));
  }

  /**
   * 批量删除文档
   */
  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length > 0) {
      await this.db.delete(docs).where(inArray(docs.id, ids));
    }
  }

  /**
   * 删除文档及其所有后代
   */
  async deleteWithDescendants(id: string): Promise<void> {
    const descendantIds = await this.findDescendantIds(id);
    await this.deleteMany(descendantIds);
  }
}
