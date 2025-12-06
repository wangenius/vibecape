import { tool } from "ai";
import { z } from "zod";
import { DocsService } from "@main/services/Docs";
import { createEmptyDoc } from "@common/lib/content-converter";

/**
 * 文档管理工具集
 *
 * 提供文档的 CRUD 和组织管理能力：
 * - 创建、读取、更新、删除文档
 * - 移动、重排序文档
 * - 获取文档树结构
 *
 * 注意：这些操作直接在主进程执行
 * 前端刷新由 ChatHandler 在对话结束时统一处理
 */
export const createDocManagementTools = () => {
  return {
    // ============ 查询工具 ============

    getDocumentTree: tool({
      description:
        "获取当前工作区的完整文档树结构。用于了解文档组织和查找文档。",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const tree = await DocsService.getTree();
          return { success: true, tree };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    getDocumentInfo: tool({
      description: "获取指定文档的详细信息，包括标题、内容、元数据等。",
      inputSchema: z.object({
        docId: z.string().describe("文档 ID"),
      }),
      execute: async ({ docId }) => {
        try {
          const doc = await DocsService.getDoc(docId);
          if (!doc) {
            return { success: false, error: "文档不存在" };
          }
          return { success: true, doc };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    // ============ 创建工具 ============

    createDocument: tool({
      description: "创建新文档。可以指定父文档ID将其创建为子文档。",
      inputSchema: z.object({
        title: z.string().describe("文档标题"),
        parentId: z
          .string()
          .optional()
          .describe("父文档ID，不填则创建为根文档"),
        description: z.string().optional().describe("文档描述"),
      }),
      execute: async ({ title, parentId, description }) => {
        try {
          const doc = await DocsService.createDoc({
            title,
            parent_id: parentId ?? null,
            content: createEmptyDoc(),
            metadata: description ? { description } : {},
          });
          return {
            success: true,
            docId: doc.id,
            message: `文档"${title}"创建成功`,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    // ============ 更新工具 ============

    renameDocument: tool({
      description: "重命名文档（修改标题）。",
      inputSchema: z.object({
        docId: z.string().describe("文档 ID"),
        newTitle: z.string().describe("新标题"),
      }),
      execute: async ({ docId, newTitle }) => {
        try {
          const doc = await DocsService.updateDoc(docId, { title: newTitle });
          if (!doc) {
            return { success: false, error: "文档不存在" };
          }
          return { success: true, message: `文档已重命名为"${newTitle}"` };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    updateDocumentMetadata: tool({
      description: "更新文档的元数据（如描述、图标等）。",
      inputSchema: z.object({
        docId: z.string().describe("文档 ID"),
        metadata: z.record(z.any()).describe("要更新的元数据字段"),
      }),
      execute: async ({ docId, metadata }) => {
        try {
          // 先获取现有文档
          const existingDoc = await DocsService.getDoc(docId);
          if (!existingDoc) {
            return { success: false, error: "文档不存在" };
          }

          // 合并元数据
          const newMetadata = { ...existingDoc.metadata, ...metadata };
          const doc = await DocsService.updateDoc(docId, {
            metadata: newMetadata,
          });

          return {
            success: true,
            message: "元数据已更新",
            metadata: doc?.metadata,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    // ============ 组织工具 ============

    moveDocument: tool({
      description: "将文档移动到另一个父文档下（或移动到根级别）。",
      inputSchema: z.object({
        docId: z.string().describe("要移动的文档 ID"),
        newParentId: z
          .string()
          .optional()
          .describe("新的父文档 ID，不填则移动到根级别"),
      }),
      execute: async ({ docId, newParentId }) => {
        try {
          await DocsService.moveDoc(docId, newParentId ?? null);
          const targetDesc = newParentId ? `文档 ${newParentId} 下` : "根级别";
          return { success: true, message: `文档已移动到${targetDesc}` };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    reorderDocument: tool({
      description: "调整文档在同级中的顺序。将一个文档移动到另一个文档的位置。",
      inputSchema: z.object({
        activeId: z.string().describe("要移动的文档 ID"),
        overId: z.string().describe("目标位置的文档 ID"),
      }),
      execute: async ({ activeId, overId }) => {
        try {
          await DocsService.reorderDoc(activeId, overId);
          return { success: true, message: "文档顺序已调整" };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    // ============ 删除工具 ============

    deleteDocument: tool({
      description: "删除文档。注意：这会同时删除所有子文档！请谨慎使用。",
      inputSchema: z.object({
        docId: z.string().describe("要删除的文档 ID"),
        confirm: z.boolean().describe("确认删除，必须为 true 才会执行"),
      }),
      execute: async ({ docId, confirm }) => {
        if (!confirm) {
          return { success: false, error: "未确认删除操作" };
        }

        try {
          // 先获取文档信息用于反馈
          const doc = await DocsService.getDoc(docId);
          if (!doc) {
            return { success: false, error: "文档不存在" };
          }

          await DocsService.deleteDoc(docId);
          return {
            success: true,
            message: `文档"${doc.title}"及其子文档已删除`,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    // ============ 搜索工具 ============

    findDocumentByTitle: tool({
      description: "按标题搜索文档。返回匹配的文档列表。",
      inputSchema: z.object({
        query: z.string().describe("搜索关键词"),
        exact: z.boolean().optional().describe("是否精确匹配，默认为模糊匹配"),
      }),
      execute: async ({ query, exact = false }) => {
        try {
          const tree = await DocsService.getTree();
          const results: { id: string; title: string; path: string[] }[] = [];

          // 递归搜索文档树
          const searchTree = (nodes: typeof tree, path: string[] = []) => {
            for (const node of nodes) {
              const currentPath = [...path, node.title];
              const matches = exact
                ? node.title === query
                : node.title.toLowerCase().includes(query.toLowerCase());

              if (matches) {
                results.push({
                  id: node.id,
                  title: node.title,
                  path: currentPath,
                });
              }

              if (node.children?.length) {
                searchTree(node.children, currentPath);
              }
            }
          };

          searchTree(tree);

          return {
            success: true,
            count: results.length,
            results,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),
  };
};
