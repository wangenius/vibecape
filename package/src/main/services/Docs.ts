/**
 * 文档服务
 * 处理文档 CRUD 操作
 * 使用 WorkspaceService 管理工作区
 * 使用 Repository 层进行数据访问
 */

import fs from "fs/promises";
import { dialog } from "electron";
import { asc } from "drizzle-orm";
import { docs, type DocTreeNode, type DocData } from "@common/schema/docs";
import { getDocsDb } from "@main/db/docs";
import { WorkspaceService } from "./Workspace";
import { DocsRepository } from "@main/repositories";
import type { JSONContent } from "@tiptap/core";
import {
  jsonToMarkdown,
  markdownToJSON,
  parseMarkdownWithFrontmatter,
  stringifyWithFrontmatter,
} from "@common/lib/content-converter";

// ==================== 文档服务 ====================
// 注意: Markdown 转换工具已移至 @common/lib/content-converter

// ==================== 文档服务 ====================

export class DocsService {
  /**
   * 获取当前工作区的数据库
   */
  private static async getDb() {
    const workspace = WorkspaceService.getCurrentWorkspace();
    if (!workspace) {
      throw new Error("未打开工作区");
    }
    return getDocsDb(workspace.docs_db_path);
  }

  /**
   * 获取当前工作区的 Repository
   */
  private static async getRepository(): Promise<DocsRepository> {
    const db = await this.getDb();
    return new DocsRepository(db);
  }

  // ==================== 文档 CRUD ====================

  /**
   * 获取文档树
   */
  static async getTree(): Promise<DocTreeNode[]> {
    const repo = await this.getRepository();
    const allDocs = await repo.findAll();

    const nodeMap = new Map<string, DocTreeNode>();
    const roots: DocTreeNode[] = [];

    for (const doc of allDocs) {
      nodeMap.set(doc.id, {
        id: doc.id,
        title: doc.title,
        order: doc.order,
        metadata: doc.metadata,
        children: [],
      });
    }

    for (const doc of allDocs) {
      const node = nodeMap.get(doc.id)!;
      if (doc.parent_id) {
        const parent = nodeMap.get(doc.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    const cleanChildren = (node: DocTreeNode) => {
      if (node.children?.length === 0) {
        delete node.children;
      } else {
        node.children?.forEach(cleanChildren);
      }
    };
    roots.forEach(cleanChildren);

    return roots;
  }

  /**
   * 获取单个文档
   */
  static async getDoc(id: string): Promise<DocData | null> {
    const repo = await this.getRepository();
    const doc = await repo.findById(id);
    if (!doc) return null;

    return {
      id: doc.id,
      parent_id: doc.parent_id,
      title: doc.title,
      content: doc.content,
      metadata: doc.metadata,
      order: doc.order,
    };
  }

  /**
   * 创建文档
   */
  static async createDoc(data: {
    parent_id?: string | null;
    title: string;
    content?: JSONContent;
    metadata?: Record<string, any>;
  }): Promise<DocData> {
    const repo = await this.getRepository();
    const maxOrder = await repo.getMaxOrder(data.parent_id ?? null);

    const doc = await repo.create({
      parent_id: data.parent_id ?? null,
      title: data.title,
      content: data.content,
      metadata: data.metadata,
      order: maxOrder + 1,
    });

    return {
      id: doc.id,
      parent_id: doc.parent_id,
      title: doc.title,
      content: doc.content,
      metadata: doc.metadata,
      order: doc.order,
    };
  }

  /**
   * 更新文档
   */
  static async updateDoc(
    id: string,
    data: Partial<{
      title: string;
      content: JSONContent;
      metadata: Record<string, any>;
      parent_id: string | null;
      order: number;
    }>
  ): Promise<DocData | null> {
    const repo = await this.getRepository();
    const doc = await repo.update(id, data);

    if (!doc) return null;

    return {
      id: doc.id,
      parent_id: doc.parent_id,
      title: doc.title,
      content: doc.content,
      metadata: doc.metadata,
      order: doc.order,
    };
  }

  /**
   * 删除文档 (使用 Repository 的递归删除)
   */
  static async deleteDoc(id: string): Promise<void> {
    const repo = await this.getRepository();
    await repo.deleteWithDescendants(id);
  }

  // ==================== 排序 ====================

  /**
   * 重新排序文档 - 支持同级和跨级排序
   * 如果 activeDoc 和 overDoc 不在同一父级，会先将 activeDoc 移动到 overDoc 的父级
   */
  static async reorderDoc(activeId: string, overId: string): Promise<void> {
    const repo = await this.getRepository();

    const [activeDoc, overDoc] = await Promise.all([
      repo.findById(activeId),
      repo.findById(overId),
    ]);

    if (!activeDoc || !overDoc) {
      throw new Error("文档不存在");
    }

    const targetParentId = overDoc.parent_id;

    // 如果不在同一父级，先移动到目标父级
    if (activeDoc.parent_id !== targetParentId) {
      await repo.update(activeId, { parent_id: targetParentId });
    }

    // 获取目标父级下的所有兄弟节点（包含刚移动过来的 activeDoc）
    const siblings = await repo.findByParent(targetParentId);

    const activeIndex = siblings.findIndex((d) => d.id === activeId);
    const overIndex = siblings.findIndex((d) => d.id === overId);

    if (activeIndex === -1 || overIndex === -1) return;

    const [removed] = siblings.splice(activeIndex, 1);
    siblings.splice(overIndex, 0, removed);

    // 批量更新所有顺序
    const updates = siblings.map((doc, i) => ({ id: doc.id, order: i }));
    await repo.updateOrderBatch(updates);
  }

  /**
   * 移动文档到新的父级
   */
  static async moveDoc(
    docId: string,
    newParentId: string | null
  ): Promise<void> {
    const repo = await this.getRepository();
    const maxOrder = await repo.getMaxOrder(newParentId);

    await repo.update(docId, {
      parent_id: newParentId,
      order: maxOrder + 1,
    });
  }

  // ==================== 导出 ====================

  /**
   * 导出单个文档为 Markdown
   */
  static async exportDocAsMarkdown(id: string): Promise<void> {
    const doc = await this.getDoc(id);
    if (!doc) {
      throw new Error("文档不存在");
    }

    const markdown = jsonToMarkdown(doc.content);
    const content = stringifyWithFrontmatter(markdown, {
      title: doc.title,
      ...doc.metadata,
    });

    const result = await dialog.showSaveDialog({
      title: "导出为 Markdown",
      defaultPath: `${doc.title}.md`,
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });

    if (result.canceled || !result.filePath) {
      return;
    }

    await fs.writeFile(result.filePath, content, "utf-8");
  }

  /**
   * 导出单个文档为 PDF
   */
  static async exportDocAsPdf(id: string): Promise<void> {
    const doc = await this.getDoc(id);
    if (!doc) {
      throw new Error("文档不存在");
    }

    const result = await dialog.showSaveDialog({
      title: "导出为 PDF",
      defaultPath: `${doc.title}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });

    if (result.canceled || !result.filePath) {
      return;
    }

    const markdown = jsonToMarkdown(doc.content);
    const html = markdownToHtml(markdown, doc.title);

    const { BrowserWindow } = await import("electron");
    const win = new BrowserWindow({
      show: false,
      webPreferences: { offscreen: true },
    });

    await win.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );
    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
    });
    await fs.writeFile(result.filePath, pdfData);
    win.close();
  }

  // ==================== 导入 ====================

  /**
   * 导入 Markdown 文件
   */
  static async importMarkdownFile(filePath: string): Promise<DocData> {
    const content = await fs.readFile(filePath, "utf-8");
    const { title, body, metadata } = parseMarkdownWithFrontmatter(
      content,
      filePath
        .split("/")
        .pop()
        ?.replace(/\.(md|mdx)$/, "")
    );
    const jsonContent = markdownToJSON(body);

    return this.createDoc({
      title,
      content: jsonContent,
      metadata,
    });
  }

  /**
   * 导入 Fumadocs 目录
   */
  static async importFumadocsDirectory(dirPath: string): Promise<number> {
    const self = this;
    const importDir = async (
      dir: string,
      parentId: string | null
    ): Promise<number> => {
      let count = 0;
      const entries = await fs.readdir(dir, { withFileTypes: true });

      // 按名称排序
      entries.sort((a, b) => a.name.localeCompare(b.name));

      for (const entry of entries) {
        const fullPath = `${dir}/${entry.name}`;

        if (entry.isDirectory()) {
          // 创建文件夹文档
          const folderDoc = await self.createDoc({
            parent_id: parentId,
            title: entry.name,
            content: { type: "doc", content: [{ type: "paragraph" }] },
          });
          count++;

          // 递归导入子目录
          count += await importDir(fullPath, folderDoc.id);
        } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
          const content = await fs.readFile(fullPath, "utf-8");
          const { title, body, metadata } = parseMarkdownWithFrontmatter(
            content,
            entry.name.replace(/\.(md|mdx)$/, "")
          );
          const jsonContent = markdownToJSON(body);

          await self.createDoc({
            parent_id: parentId,
            title,
            content: jsonContent,
            metadata,
          });
          count++;
        }
      }

      return count;
    };

    return importDir(dirPath, null);
  }

  /**
   * 导入 Vibecape docs.db 文件
   */
  static async importVibecapeDb(dbPath: string): Promise<number> {
    const sourceDb = await getDocsDb(dbPath);
    const allDocs = await sourceDb.select().from(docs).orderBy(asc(docs.order));

    // 创建 ID 映射（旧 ID -> 新 ID）
    const idMap = new Map<string, string>();

    // 先导入所有根文档
    const rootDocs = allDocs.filter((d) => !d.parent_id);
    for (const doc of rootDocs) {
      const newDoc = await this.createDoc({
        title: doc.title,
        content: doc.content,
        metadata: doc.metadata,
      });
      idMap.set(doc.id, newDoc.id);
    }

    // 递归导入子文档
    const importChildren = async (parentId: string) => {
      const children = allDocs.filter((d) => d.parent_id === parentId);
      for (const doc of children) {
        const newParentId = idMap.get(parentId);
        const newDoc = await this.createDoc({
          parent_id: newParentId,
          title: doc.title,
          content: doc.content,
          metadata: doc.metadata,
        });
        idMap.set(doc.id, newDoc.id);
        await importChildren(doc.id);
      }
    };

    for (const doc of rootDocs) {
      await importChildren(doc.id);
    }

    return allDocs.length;
  }
}

// ==================== HTML 工具 ====================

function markdownToHtml(markdown: string, title: string): string {
  let html = markdown
    .replace(/^###### (.+)$/gm, "<h6>$1</h6>")
    .replace(/^##### (.+)$/gm, "<h5>$1</h5>")
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre><code class="$1">$2</code></pre>'
    )
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/^(?!<[hlopuc])(.*[^>])$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "")
    .replace(/<p>\s*<\/p>/g, "");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-family: 'SF Mono', Monaco, monospace; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
    a { color: #0066cc; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}
