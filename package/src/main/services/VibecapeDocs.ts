/**
 * Vibecape 文档服务
 * 处理数据库 CRUD、MDX 转换、同步等操作
 */

import fs from "fs/promises";
import path from "path";
import { dialog } from "electron";
import { eq, isNull, asc } from "drizzle-orm";
import { docs, type DocTreeNode, type DocData, type VibecapeWorkspace } from "@common/schema/docs";
import {
  getDocsDb,
  getWorkspaceInfo,
  initVibecapeWorkspace,
} from "@main/db/docs";
import { SettingsService } from "./Settings";
import type { JSONContent } from "@tiptap/core";

const DOC_EXTENSIONS = [".md", ".mdx", ".mdoc"];

// ==================== Markdown 解析工具 ====================

/**
 * 解析 frontmatter
 */
function parseFrontmatter(content: string): {
  metadata: Record<string, any>;
  body: string;
} {
  if (!content.startsWith("---")) {
    return { metadata: {}, body: content };
  }

  const end = content.indexOf("\n---", 3);
  if (end === -1) {
    return { metadata: {}, body: content };
  }

  const raw = content.slice(3, end).trim();
  const body = content.slice(end + 4).replace(/^\s*/, "");
  const metadata: Record<string, any> = {};

  raw.split("\n").forEach((line) => {
    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) return;
    const valueRaw = rest.join(":").trim();
    if (valueRaw === "true" || valueRaw === "false") {
      metadata[key.trim()] = valueRaw === "true";
    } else if (!isNaN(Number(valueRaw))) {
      metadata[key.trim()] = Number(valueRaw);
    } else {
      metadata[key.trim()] = valueRaw.replace(/^['"]|['"]$/g, "");
    }
  });

  return { metadata, body };
}

/**
 * 生成 frontmatter 字符串
 */
function stringifyFrontmatter(
  body: string,
  metadata?: Record<string, any>
): string {
  const meta = metadata ?? {};
  if (Object.keys(meta).length === 0) {
    return body;
  }

  const lines = Object.entries(meta).map(([key, value]) => {
    if (typeof value === "object") {
      return `${key}: ${JSON.stringify(value)}`;
    }
    return `${key}: ${String(value)}`;
  });

  return `---\n${lines.join("\n")}\n---\n\n${body}`;
}

/**
 * Markdown 转 JSONContent (简化版，实际项目中可能需要更完整的解析器)
 */
function markdownToJSONContent(markdown: string): JSONContent {
  // 简单实现：将 markdown 作为文本内容
  // 实际使用时，前端会用 tiptap-markdown 处理
  const lines = markdown.split("\n");
  const content: JSONContent[] = [];

  for (const line of lines) {
    if (line.trim() === "") {
      continue;
    }

    // 处理标题
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      content.push({
        type: "heading",
        attrs: { level: headingMatch[1].length },
        content: [{ type: "text", text: headingMatch[2] }],
      });
      continue;
    }

    // 普通段落
    content.push({
      type: "paragraph",
      content: line.trim() ? [{ type: "text", text: line }] : undefined,
    });
  }

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  };
}

/**
 * JSONContent 转 Markdown
 */
function jsonContentToMarkdown(content: JSONContent): string {
  if (!content.content) return "";

  const lines: string[] = [];

  for (const node of content.content) {
    switch (node.type) {
      case "heading": {
        const level = node.attrs?.level || 1;
        const text = extractText(node);
        lines.push(`${"#".repeat(level)} ${text}`);
        break;
      }
      case "paragraph": {
        const text = extractText(node);
        lines.push(text);
        break;
      }
      case "bulletList": {
        if (node.content) {
          for (const item of node.content) {
            const text = extractText(item);
            lines.push(`- ${text}`);
          }
        }
        break;
      }
      case "orderedList": {
        if (node.content) {
          node.content.forEach((item, i) => {
            const text = extractText(item);
            lines.push(`${i + 1}. ${text}`);
          });
        }
        break;
      }
      case "codeBlock": {
        const lang = node.attrs?.language || "";
        const text = extractText(node);
        lines.push(`\`\`\`${lang}\n${text}\n\`\`\``);
        break;
      }
      case "blockquote": {
        const text = extractText(node);
        lines.push(`> ${text}`);
        break;
      }
      default: {
        const text = extractText(node);
        if (text) lines.push(text);
      }
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

/**
 * 从节点提取纯文本
 */
function extractText(node: JSONContent): string {
  if (node.text) return node.text;
  if (!node.content) return "";
  return node.content.map(extractText).join("");
}

// ==================== VibecapeDocs 服务 ====================

export class VibecapeDocsService {
  private static currentWorkspace: VibecapeWorkspace | null = null;

  /**
   * 获取当前工作区
   */
  static async getCurrentWorkspace(): Promise<VibecapeWorkspace | null> {
    if (this.currentWorkspace) return this.currentWorkspace;

    const settings = await SettingsService.get();
    const root = settings.general?.vibecapeRoot;
    if (!root) return null;

    this.currentWorkspace = getWorkspaceInfo(root);
    return this.currentWorkspace;
  }

  /**
   * 选择并创建工作区
   * 选择 docs 目录，.vibecape 将在其内部创建
   */
  static async createWorkspace(): Promise<VibecapeWorkspace | null> {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
      title: "选择 docs 目录",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const docsDir = result.filePaths[0];
    const { workspace } = await initVibecapeWorkspace(docsDir);

    // 保存到设置
    await SettingsService.update(["general", "vibecapeRoot"], docsDir);
    this.currentWorkspace = workspace;

    return workspace;
  }

  /**
   * 选择 docs 目录（仅打开文件选择器）
   */
  static async pickDocsFolder(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
      title: "选择 docs 目录",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  }

  /**
   * 初始化指定目录的工作区
   * 返回初始化结果，包括是否需要导入
   */
  static async initWorkspace(docsDir: string): Promise<{
    workspace: VibecapeWorkspace;
    needsImport: boolean;
  }> {
    let workspace = getWorkspaceInfo(docsDir);
    let needsImport = false;

    // 如果工作区不存在，自动初始化
    if (!workspace.initialized) {
      const { workspace: newWorkspace } = await initVibecapeWorkspace(docsDir);
      workspace = newWorkspace;
      needsImport = true; // 新工作区需要导入
    }

    await SettingsService.update(["general", "vibecapeRoot"], docsDir);
    this.currentWorkspace = workspace;

    return { workspace, needsImport };
  }

  /**
   * 打开或创建工作区（组合方法，已废弃，使用 pickDocsFolder + initWorkspace）
   */
  static async openWorkspace(): Promise<VibecapeWorkspace | null> {
    const docsDir = await this.pickDocsFolder();
    if (!docsDir) return null;
    const { workspace } = await this.initWorkspace(docsDir);
    return workspace;
  }

  /**
   * 获取数据库实例
   */
  private static async getDb() {
    const workspace = await this.getCurrentWorkspace();
    if (!workspace?.initialized) {
      throw new Error("未初始化工作区");
    }
    return getDocsDb(workspace.dbPath);
  }

  // ==================== 文档 CRUD ====================

  /**
   * 获取文档树
   */
  static async getTree(): Promise<DocTreeNode[]> {
    const db = await this.getDb();
    const allDocs = await db
      .select()
      .from(docs)
      .orderBy(asc(docs.order));

    // 构建树结构
    const nodeMap = new Map<string, DocTreeNode>();
    const roots: DocTreeNode[] = [];

    // 第一遍：创建所有节点
    for (const doc of allDocs) {
      nodeMap.set(doc.id, {
        id: doc.id,
        title: doc.title,
        order: doc.order,
        metadata: doc.metadata,
        children: [],
      });
    }

    // 第二遍：构建父子关系
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

    // 清理空 children
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
    const db = await this.getDb();
    const result = await db.select().from(docs).where(eq(docs.id, id)).limit(1);
    if (result.length === 0) return null;

    const doc = result[0];
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
    const db = await this.getDb();

    // 获取同级最大 order
    const siblings = await db
      .select({ order: docs.order })
      .from(docs)
      .where(data.parent_id ? eq(docs.parent_id, data.parent_id) : isNull(docs.parent_id))
      .orderBy(asc(docs.order));

    const maxOrder = siblings.length > 0 ? siblings[siblings.length - 1].order : -1;

    const now = Date.now();
    const result = await db
      .insert(docs)
      .values({
        parent_id: data.parent_id ?? null,
        title: data.title,
        content: data.content || { type: "doc", content: [{ type: "paragraph" }] },
        metadata: data.metadata || {},
        order: maxOrder + 1,
        created_at: now,
        updated_at: now,
      })
      .returning();

    const doc = result[0];
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
    const db = await this.getDb();

    const result = await db
      .update(docs)
      .set({
        ...data,
        updated_at: Date.now(),
      })
      .where(eq(docs.id, id))
      .returning();

    if (result.length === 0) return null;

    const doc = result[0];
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
   * 删除文档 (递归删除子文档)
   */
  static async deleteDoc(id: string): Promise<void> {
    const db = await this.getDb();

    // 递归获取所有子节点
    const getDescendants = async (parentId: string): Promise<string[]> => {
      const children = await db
        .select({ id: docs.id })
        .from(docs)
        .where(eq(docs.parent_id, parentId));

      const ids: string[] = [];
      for (const child of children) {
        ids.push(child.id);
        ids.push(...(await getDescendants(child.id)));
      }
      return ids;
    };

    const descendantIds = await getDescendants(id);
    const allIds = [id, ...descendantIds];

    // 删除所有节点
    for (const docId of allIds) {
      await db.delete(docs).where(eq(docs.id, docId));
    }
  }

  // ==================== 同步功能 ====================

  /**
   * 重新排序文档（同级）
   */
  static async reorderDoc(activeId: string, overId: string): Promise<void> {
    const db = await this.getDb();
    
    // 获取两个文档
    const [activeDoc] = await db.select().from(docs).where(eq(docs.id, activeId));
    const [overDoc] = await db.select().from(docs).where(eq(docs.id, overId));
    
    if (!activeDoc || !overDoc) {
      throw new Error("文档不存在");
    }

    // 必须是同一个父级
    if (activeDoc.parent_id !== overDoc.parent_id) {
      throw new Error("只能在同级之间排序");
    }

    // 获取同级所有文档
    const siblings = await db
      .select()
      .from(docs)
      .where(
        activeDoc.parent_id 
          ? eq(docs.parent_id, activeDoc.parent_id)
          : isNull(docs.parent_id)
      )
      .orderBy(asc(docs.order));

    // 重新计算顺序
    const activeIndex = siblings.findIndex(d => d.id === activeId);
    const overIndex = siblings.findIndex(d => d.id === overId);
    
    if (activeIndex === -1 || overIndex === -1) return;

    // 移动元素
    const [removed] = siblings.splice(activeIndex, 1);
    siblings.splice(overIndex, 0, removed);

    // 更新所有顺序
    for (let i = 0; i < siblings.length; i++) {
      await db.update(docs).set({ order: i }).where(eq(docs.id, siblings[i].id));
    }
  }

  /**
   * 移动文档到新的父级
   */
  static async moveDoc(docId: string, newParentId: string | null): Promise<void> {
    const db = await this.getDb();
    
    // 获取目标父级下的最大 order
    const siblings = await db
      .select()
      .from(docs)
      .where(newParentId ? eq(docs.parent_id, newParentId) : isNull(docs.parent_id))
      .orderBy(asc(docs.order));

    const maxOrder = siblings.length > 0 ? siblings[siblings.length - 1].order + 1 : 0;

    // 更新文档的父级和顺序
    await db
      .update(docs)
      .set({ parent_id: newParentId, order: maxOrder })
      .where(eq(docs.id, docId));
  }

  /**
   * 从 docs 目录导入到数据库 (覆盖)
   */
  static async importFromDocs(): Promise<{ imported: number }> {
    const workspace = await this.getCurrentWorkspace();
    if (!workspace?.docsPath) {
      throw new Error("docs 目录不存在");
    }

    const db = await this.getDb();

    // 清空现有数据
    await db.delete(docs);

    // 递归扫描并导入
    let imported = 0;
    const importDir = async (dirPath: string, parentId: string | null, isRoot = false) => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      // 按名称排序
      entries.sort((a, b) => a.name.localeCompare(b.name));

      let order = 0;

      // 对于根目录，先处理 index 文件
      if (isRoot) {
        const rootIndexFile = await findIndexFile(dirPath);
        if (rootIndexFile) {
          const fileContent = await fs.readFile(rootIndexFile, "utf-8");
          const parsed = parseFrontmatter(fileContent);
          const now = Date.now();
          await db.insert(docs).values({
            parent_id: null,
            title: parsed.metadata.title || "首页",
            content: markdownToJSONContent(parsed.body),
            metadata: parsed.metadata,
            order: order++,
            created_at: now,
            updated_at: now,
          });
          imported++;
        }
      }

      for (const entry of entries) {
        if (entry.name.startsWith(".")) continue;

        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // 检查目录下是否有 index 文件
          const indexFile = await findIndexFile(fullPath);
          
          let content: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };
          let metadata: Record<string, any> = {};
          let title = entry.name;

          if (indexFile) {
            const fileContent = await fs.readFile(indexFile, "utf-8");
            const parsed = parseFrontmatter(fileContent);
            content = markdownToJSONContent(parsed.body);
            metadata = parsed.metadata;
            title = parsed.metadata.title || entry.name;
          }

          const now = Date.now();
          const result = await db
            .insert(docs)
            .values({
              parent_id: parentId,
              title,
              content,
              metadata,
              order: order++,
              created_at: now,
              updated_at: now,
            })
            .returning();

          imported++;
          
          // 递归处理子目录
          await importDir(fullPath, result[0].id, false);
        } else if (isDocFile(entry.name) && !isIndexFile(entry.name)) {
          // 非 index 的文档文件
          const fileContent = await fs.readFile(fullPath, "utf-8");
          const parsed = parseFrontmatter(fileContent);
          const baseName = entry.name.replace(/\.(md|mdx|mdoc)$/i, "");

          const now = Date.now();
          await db.insert(docs).values({
            parent_id: parentId,
            title: parsed.metadata.title || baseName,
            content: markdownToJSONContent(parsed.body),
            metadata: parsed.metadata,
            order: order++,
            created_at: now,
            updated_at: now,
          });

          imported++;
        }
      }
    };

    await importDir(workspace.docsPath, null, true);

    return { imported };
  }

  /**
   * 从数据库导出到 docs 目录 (覆盖)
   * 注意：只覆盖文档文件，不删除 .vibecape 目录
   */
  static async exportToDocs(): Promise<{ exported: number }> {
    const workspace = await this.getCurrentWorkspace();
    if (!workspace?.docsPath) {
      throw new Error("未初始化工作区");
    }

    const docsPath = workspace.docsPath;

    // 清理现有文档文件（保留 .vibecape 等隐藏目录）
    const entries = await fs.readdir(docsPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue; // 跳过隐藏文件/目录
      const fullPath = path.join(docsPath, entry.name);
      await fs.rm(fullPath, { recursive: true, force: true });
    }

    const db = await this.getDb();
    const allDocs = await db.select().from(docs).orderBy(asc(docs.order));

    let exported = 0;

    // 递归导出
    const exportDoc = async (doc: typeof allDocs[0], parentPath: string) => {
      const children = allDocs.filter((d) => d.parent_id === doc.id);

      if (children.length > 0) {
        // 有子节点，创建目录 (使用 id 作为目录名)
        const dirPath = path.join(parentPath, doc.id);
        await fs.mkdir(dirPath, { recursive: true });

        // 写入 index 文件
        const markdown = jsonContentToMarkdown(doc.content);
        const content = stringifyFrontmatter(markdown, {
          title: doc.title,
          ...doc.metadata,
        });
        await fs.writeFile(path.join(dirPath, "index.mdx"), content, "utf-8");
        exported++;

        // 递归导出子节点
        for (const child of children) {
          await exportDoc(child, dirPath);
        }
      } else {
        // 叶子节点，直接写文件 (使用 id 作为文件名)
        const markdown = jsonContentToMarkdown(doc.content);
        const content = stringifyFrontmatter(markdown, {
          title: doc.title,
          ...doc.metadata,
        });
        await fs.writeFile(
          path.join(parentPath, `${doc.id}.mdx`),
          content,
          "utf-8"
        );
        exported++;
      }
    };

    // 导出根节点
    const roots = allDocs.filter((d) => !d.parent_id);
    for (const root of roots) {
      await exportDoc(root, docsPath);
    }

    return { exported };
  }
}

// ==================== 工具函数 ====================

function isDocFile(filename: string): boolean {
  return DOC_EXTENSIONS.includes(path.extname(filename).toLowerCase());
}

function isIndexFile(filename: string): boolean {
  const base = path.basename(filename, path.extname(filename));
  return base.toLowerCase() === "index";
}

async function findIndexFile(dirPath: string): Promise<string | null> {
  for (const ext of DOC_EXTENSIONS) {
    const indexPath = path.join(dirPath, `index${ext}`);
    try {
      await fs.access(indexPath);
      return indexPath;
    } catch {}
  }
  return null;
}
