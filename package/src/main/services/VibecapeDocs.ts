/**
 * Vibecape 文档服务
 * 处理数据库 CRUD、MDX 转换、同步等操作
 */

import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { dialog } from "electron";
import { eq, isNull, asc } from "drizzle-orm";
import {
  docs,
  type DocTreeNode,
  type DocData,
  type VibecapeWorkspace,
  DEFAULT_WORKSPACE_CONFIG,
  type WorkspaceConfig,
  WORKSPACE_DIR_NAME,
  LEGACY_WORKSPACE_DIR_NAME,
} from "@common/schema/docs";
import type { WorkspaceHistoryEntry } from "@common/schema/app";
import {
  getDocsDb,
  getWorkspaceInfo,
  initVibecapeWorkspace,
} from "@main/db/docs";
import { SettingsService } from "./Settings";
import type { JSONContent } from "@tiptap/core";

const DOC_EXTENSIONS = [".md", ".mdx", ".mdoc"];
const WORKSPACE_DIR_BLACKLIST = new Set([
  WORKSPACE_DIR_NAME,
  LEGACY_WORKSPACE_DIR_NAME,
]);

function mergeWorkspaceConfig(
  stored?: Partial<WorkspaceConfig>
): WorkspaceConfig {
  return {
    fumadocs: {
      ...DEFAULT_WORKSPACE_CONFIG.fumadocs,
      ...(stored?.fumadocs ?? {}),
    },
    publishing: {
      ...DEFAULT_WORKSPACE_CONFIG.publishing,
      ...(stored?.publishing ?? {}),
    },
  };
}

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

  private static async ensureWorkspaceConfig(
    workspace: VibecapeWorkspace
  ): Promise<WorkspaceConfig> {
    const mergedDefaults = DEFAULT_WORKSPACE_CONFIG;
    try {
      await fs.mkdir(path.dirname(workspace.configPath), { recursive: true });
      const raw = await fs.readFile(workspace.configPath, "utf-8");
      const parsed = JSON.parse(raw) as Partial<WorkspaceConfig>;
      const config = mergeWorkspaceConfig(parsed);
      await fs.writeFile(
        workspace.configPath,
        JSON.stringify(config, null, 2),
        "utf-8"
      );
      return config;
    } catch (error) {
      console.warn(
        "[VibecapeDocsService] Failed to load workspace config, using defaults:",
        error
      );
      await fs.writeFile(
        workspace.configPath,
        JSON.stringify(mergedDefaults, null, 2),
        "utf-8"
      );
      return mergedDefaults;
    }
  }

  private static async withWorkspaceConfig(
    workspace: VibecapeWorkspace
  ): Promise<VibecapeWorkspace> {
    const config = await this.ensureWorkspaceConfig(workspace);
    return { ...workspace, config };
  }

  private static async recordWorkspaceHistory(docsDir: string): Promise<void> {
    const settings = await SettingsService.get();
    const history = settings.general?.recentWorkspaces || [];
    const now = Date.now();
    const name = path.basename(docsDir);

    const updated: WorkspaceHistoryEntry[] = [
      { path: docsDir, name, lastOpenedAt: now },
      ...history.filter((item) => item.path !== docsDir),
    ].slice(0, 10);

    await SettingsService.update(["general", "recentWorkspaces"], updated);
  }

  static async getWorkspaceHistory(): Promise<
    (WorkspaceHistoryEntry & { exists: boolean })[]
  > {
    const settings = await SettingsService.get();
    const history = settings.general?.recentWorkspaces || [];

    return history
      .map((item) => ({
        ...item,
        exists: fsSync.existsSync(item.path),
      }))
      .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
  }

  static async removeWorkspaceFromHistory(targetPath: string): Promise<void> {
    const settings = await SettingsService.get();
    const history = settings.general?.recentWorkspaces || [];
    const next = history.filter((item) => item.path !== targetPath);
    await SettingsService.update(["general", "recentWorkspaces"], next);
  }

  /**
   * 获取当前工作区
   */
  static async getCurrentWorkspace(): Promise<VibecapeWorkspace | null> {
    if (this.currentWorkspace) return this.currentWorkspace;

    const settings = await SettingsService.get();
    const root = settings.general?.vibecapeRoot;
    if (!root) return null;

    const info = getWorkspaceInfo(root);
    this.currentWorkspace = info.initialized
      ? await this.withWorkspaceConfig(info)
      : info;
    return this.currentWorkspace;
  }

  /**
   * 选择并创建工作区
   * 选择 docs 目录，vibecape 工作区目录将自动创建
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
    const workspaceWithConfig = await this.withWorkspaceConfig(workspace);

    // 保存到设置
    await SettingsService.update(["general", "vibecapeRoot"], docsDir);
    await this.recordWorkspaceHistory(docsDir);
    this.currentWorkspace = workspaceWithConfig;

    return workspaceWithConfig;
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
    const wasInitialized = workspace.initialized;
    let needsImport = false;

    const preferredPath = path.join(docsDir, WORKSPACE_DIR_NAME);
    const shouldMigrateLegacy =
      path.basename(workspace.vibecapePath) === LEGACY_WORKSPACE_DIR_NAME &&
      !fsSync.existsSync(preferredPath);

    if (shouldMigrateLegacy || !workspace.initialized) {
      const { workspace: newWorkspace } = await initVibecapeWorkspace(docsDir);
      workspace = newWorkspace;
      needsImport = !wasInitialized; // 新工作区需要导入，迁移不导入
    }

    const workspaceWithConfig = await this.withWorkspaceConfig(workspace);
    await SettingsService.update(["general", "vibecapeRoot"], docsDir);
    await this.recordWorkspaceHistory(docsDir);
    this.currentWorkspace = workspaceWithConfig;

    return { workspace: workspaceWithConfig, needsImport };
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
        if (WORKSPACE_DIR_BLACKLIST.has(entry.name)) continue;

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
   * 导出单个文档为 Markdown
   */
  static async exportDocAsMarkdown(id: string): Promise<void> {
    const doc = await this.getDoc(id);
    if (!doc) {
      throw new Error("文档不存在");
    }

    const markdown = jsonContentToMarkdown(doc.content);
    const content = stringifyFrontmatter(markdown, {
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

    // 将 JSONContent 转换为 HTML 用于 PDF 生成
    const markdown = jsonContentToMarkdown(doc.content);
    const html = markdownToHtml(markdown, doc.title);

    // 使用 Electron 的 BrowserWindow 打印为 PDF
    const { BrowserWindow } = await import("electron");
    const win = new BrowserWindow({
      show: false,
      webPreferences: { offscreen: true },
    });

    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
    });
    await fs.writeFile(result.filePath, pdfData);
    win.close();
  }

  /**
   * 从数据库导出到 docs 目录 (覆盖)
   * 注意：只覆盖文档文件，不删除 vibecape 工作区目录
   */
  static async exportToDocs(): Promise<{ exported: number }> {
    const workspace = await this.getCurrentWorkspace();
    if (!workspace?.docsPath) {
      throw new Error("未初始化工作区");
    }

    const docsPath = workspace.docsPath;

    // 清理现有文档文件（保留工作区目录及隐藏目录）
    const entries = await fs.readdir(docsPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue; // 跳过隐藏文件/目录
      if (WORKSPACE_DIR_BLACKLIST.has(entry.name)) continue; // 跳过工作区目录
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

/**
 * Markdown 转 HTML (用于 PDF 导出)
 */
function markdownToHtml(markdown: string, title: string): string {
  // 简单的 Markdown 转 HTML
  let html = markdown
    // 标题
    .replace(/^###### (.+)$/gm, "<h6>$1</h6>")
    .replace(/^##### (.+)$/gm, "<h5>$1</h5>")
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // 粗体和斜体
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // 代码块
    .replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code class=\"$1\">$2</code></pre>")
    // 行内代码
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // 列表
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // 段落
    .replace(/^(?!<[hlopuc])(.*[^>])$/gm, "<p>$1</p>")
    // 清理空段落
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
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
    }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, monospace;
    }
    pre {
      background: #f4f4f4;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #ddd;
      margin: 0;
      padding-left: 16px;
      color: #666;
    }
    a { color: #0066cc; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}
