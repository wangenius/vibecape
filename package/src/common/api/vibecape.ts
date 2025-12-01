import type { JSONContent } from "@tiptap/core";
import type {
  DocTreeNode,
  DocData,
  VibecapeWorkspace,
} from "@common/schema/docs";

export interface VibecapeAPI {
  // ==================== 工作区管理 ====================
  
  /** 获取当前工作区 */
  getWorkspace: () => Promise<VibecapeWorkspace | null>;
  
  /** 创建新工作区 (选择目录并初始化 .vibecape) */
  createWorkspace: () => Promise<VibecapeWorkspace | null>;
  
  /** 打开已有工作区 */
  openWorkspace: () => Promise<VibecapeWorkspace | null>;
  
  /** 仅选择 docs 目录 */
  pickDocsFolder: () => Promise<string | null>;
  
  /** 初始化指定目录的工作区 */
  initWorkspace: (docsDir: string) => Promise<{
    workspace: VibecapeWorkspace;
    needsImport: boolean;
  }>;

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
  
  /** 删除文档 */
  deleteDoc: (id: string) => Promise<void>;
  
  /** 重新排序文档 */
  reorderDoc: (activeId: string, overId: string) => Promise<void>;
  
  /** 移动文档到新父级 */
  moveDoc: (docId: string, newParentId: string | null) => Promise<void>;

  // ==================== 同步 ====================
  
  /** 从 docs 目录导入到数据库 */
  importFromDocs: () => Promise<{ imported: number }>;
  
  /** 从数据库导出到 docs 目录 */
  exportToDocs: () => Promise<{ exported: number }>;
}
