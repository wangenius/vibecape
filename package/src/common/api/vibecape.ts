import type { JSONContent } from "@tiptap/core";
import type { DocTreeNode, DocData } from "@common/schema/docs";
import type { Repository, RepositoryEntry } from "@common/schema/repository";

export interface VibecapeAPI {
  // ==================== 工作区管理 ====================

  /** 获取当前工作区 */
  getRepository: () => Promise<Repository | null>;

  /** 获取 docs_root */
  getDocsRoot: () => Promise<string>;

  /** 设置 docs_root */
  setDocsRoot: (path: string) => Promise<void>;

  /** 创建新工作区 */
  createRepository: (name: string) => Promise<Repository>;

  /** 打开工作区 */
  openRepository: (id: string) => Promise<Repository>;

  /** 关闭当前工作区 */
  closeRepository: () => Promise<void>;

  /** 删除工作区 */
  deleteRepository: (id: string) => Promise<void>;

  /** 列出所有工作区 */
  listRepositorys: () => Promise<RepositoryEntry[]>;

  /** 恢复上次打开的工作区 */
  restoreLastRepository: () => Promise<Repository | null>;

  /** 获取 llm.txt 内容 */
  getLlmTxt: (id?: string) => Promise<string>;

  /** 设置 llm.txt 内容 */
  setLlmTxt: (content: string, id?: string) => Promise<void>;

  /** 更新工作区配置 */
  updateRepositoryConfig: (
    config: Partial<import("@common/schema/repository").RepositoryConfig>
  ) => Promise<import("@common/schema/repository").RepositoryConfig>;

  // 兼容旧 API
  /** @deprecated 使用 listRepositorys */
  getRepositoryHistory: () => Promise<RepositoryEntry[]>;

  // ==================== 文档树 ====================

  /** 获取文档树 */
  getTree: () => Promise<DocTreeNode[]>;

  // ==================== 文档 CRUD ====================

  /** 获取单个文档 */
  getDoc: (id: string) => Promise<DocData | null>;

  /** 创建文档 */
  createDoc: (data: {
    parent_id?: string | null;
    title: string;
    content?: JSONContent;
    metadata?: Record<string, any>;
  }) => Promise<DocData>;

  /** 更新文档 */
  updateDoc: (
    id: string,
    data: Partial<{
      title: string;
      content: JSONContent;
      metadata: Record<string, any>;
      parent_id: string | null;
      order: number;
    }>
  ) => Promise<DocData | null>;

  /** 删除文档 (软删除) */
  deleteDoc: (id: string) => Promise<void>;

  /** 获取回收站文档 */
  getTrash: () => Promise<DocData[]>;

  /** 恢复文档 */
  restoreDoc: (id: string) => Promise<void>;

  /** 永久删除文档 */
  deletePermanently: (id: string) => Promise<void>;

  /** 清空回收站 */
  emptyTrash: () => Promise<void>;

  /** 重新排序文档 */
  reorderDoc: (activeId: string, overId: string) => Promise<void>;

  /** 移动文档到新父级 */
  moveDoc: (docId: string, newParentId: string | null) => Promise<void>;

  // ==================== 导出单个文档 ====================

  /** 导出单个文档为 Markdown */
  exportDocAsMarkdown: (id: string) => Promise<void>;

  /** 导出单个文档为 PDF */
  exportDocAsPdf: (id: string) => Promise<void>;

  // ==================== 导入 ====================

  /** 导入 Markdown 文件 */
  importMarkdownFile: () => Promise<{ count: number }>;

  /** 导入文档目录 (Fumadocs 等) */
  importDirectory: () => Promise<{ count: number }>;

  /** 导入 Vibecape docs.db 文件 */
  importVibecapeDb: () => Promise<{ count: number }>;

  // ==================== 其他 ====================

  /** 在 Finder 中打开工作区目录 */
  openInFinder: () => Promise<void>;

  // ==================== 事件监听 ====================

  /** 监听文档变更事件 - AI 工具操作后触发 */
  onDocsChanged: (callback: (data: { tool: string }) => void) => () => void;
}
