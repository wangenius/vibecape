import fs from "fs/promises";
import path from "path";
import { dialog } from "electron";
import { SettingsService } from "./Settings";
import {
  type DocStory,
  type DocStorySummary,
  type DocNavNode,
  type DocMetaNode,
  type DocStoryMeta,
  type DocFile,
} from "@common/types/docs";

const DOC_EXTENSIONS = [".md", ".mdx", ".mdoc"];

function isDocFile(filename: string) {
  return DOC_EXTENSIONS.includes(path.extname(filename).toLowerCase());
}

function sanitizeRelativePath(relativePath: string): string {
  if (path.isAbsolute(relativePath)) {
    throw new Error("非法路径");
  }

  const normalized = path
    .normalize(relativePath)
    .replace(/^(\.\.(\/|\\|$))+/, "");
  if (!normalized || normalized.startsWith("..")) {
    throw new Error("非法路径");
  }
  return normalized;
}

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

function normalizeMetaNode(node: DocMetaNode, parentPath = ""): DocNavNode {
  const id =
    node.id ||
    node.path ||
    node.file ||
    node.href ||
    `${parentPath}/${node.title || node.name || node.label || "node"}`;

  const children = node.children || node.items;
  const title = node.title || node.name || node.label || node.file || id;
  const normalized: DocNavNode = {
    id,
    title,
    type: children && children.length > 0 ? "group" : "doc",
    path: node.file || node.path || node.href,
    meta: node.meta,
  };

  if (children && children.length > 0) {
    normalized.children = children.map((child) =>
      normalizeMetaNode(child, id)
    );
  }

  return normalized;
}

// 从文件读取 frontmatter 中的 title
async function getDocTitle(filePath: string, fallback: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const { metadata } = parseFrontmatter(content);
    return metadata.title || fallback;
  } catch {
    return fallback;
  }
}

async function scanDirectoryTree(
  storyRoot: string,
  current: string = storyRoot
): Promise<DocNavNode[]> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const nodes: DocNavNode[] = [];
  let indexNode: DocNavNode | null = null;

  // 尝试读取当前目录的 meta.json 获取 pages 排序
  const metaPath = path.join(current, "meta.json");
  const meta = await readStoryMeta(metaPath);
  const pagesOrder = (meta as any)?.pages as string[] | undefined;

  // 先目录后文件，保持导航顺序
  entries.sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()));

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(current, entry.name);
    const relative = path.relative(storyRoot, fullPath);
    const baseName = entry.name.replace(path.extname(entry.name), "");

    if (entry.isDirectory()) {
      const children = await scanDirectoryTree(storyRoot, fullPath);
      // 查找子目录中的 index 文件
      const indexChild = children.find(
        (c) => c.type === "doc" && c.meta?.isIndex
      );
      // 过滤掉子节点中的 index（因为它会作为目录本身的内容）
      const filteredChildren = children.filter(
        (c) => !(c.type === "doc" && c.meta?.isIndex)
      );
      
      if (filteredChildren.length > 0 || indexChild) {
        nodes.push({
          id: relative,
          // 使用 index 的 title 作为目录标题，否则用目录名
          title: indexChild?.title || entry.name,
          type: "group",
          path: indexChild?.path, // 目录可点击，打开其 index 文件
          children: filteredChildren.length > 0 ? filteredChildren : undefined,
        });
      }
    } else if (isDocFile(entry.name)) {
      // 从 frontmatter 读取 title
      const title = await getDocTitle(fullPath, baseName);
      const isIndex = baseName === "index";
      
      const docNode: DocNavNode = {
        id: relative,
        title,
        type: "doc",
        path: relative,
        meta: isIndex ? { isIndex: true } : undefined,
      };
      
      // 如果是 index 文件，单独保存，最后放到顶部
      if (isIndex) {
        indexNode = docNode;
      } else {
        nodes.push(docNode);
      }
    }
  }

  // 将 index 文件放到最顶部
  if (indexNode) {
    nodes.unshift(indexNode);
  }

  // 根据 meta.json 的 pages 字段排序
  if (pagesOrder && pagesOrder.length > 0) {
    nodes.sort((a, b) => {
      // 提取文件名/目录名
      const aName = a.id.split("/").pop() || a.id;
      const bName = b.id.split("/").pop() || b.id;
      const aIndex = pagesOrder.indexOf(aName);
      const bIndex = pagesOrder.indexOf(bName);
      
      // 如果都在 pages 中，按 pages 顺序
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // 如果只有一个在 pages 中，优先排前面
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      // 都不在 pages 中，保持原顺序
      return 0;
    });
  }

  return nodes;
}

async function readStoryMeta(metaPath: string): Promise<DocStoryMeta | null> {
  try {
    const raw = await fs.readFile(metaPath, "utf-8");
    return JSON.parse(raw) as DocStoryMeta;
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return null;
    }
    console.warn("[DocsService] Failed to read meta.json:", error);
    return null;
  }
}

export class DocsService {
  static async getRoot(): Promise<string | null> {
    const settings = await SettingsService.get();
    return settings.general.docsRoot || null;
  }

  static async setRoot(rootPath: string): Promise<string> {
    const absolute = path.resolve(rootPath);
    const stats = await fs.stat(absolute);
    if (!stats.isDirectory()) {
      throw new Error("路径不是有效的文件夹");
    }

    await SettingsService.update(["general", "docsRoot"], absolute);
    return absolute;
  }

  static async chooseRoot(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return this.setRoot(result.filePaths[0]);
  }

  private static async requireRoot(): Promise<string> {
    const root = await this.getRoot();
    if (!root) throw new Error("尚未设置 story 目录");
    return root;
  }

  private static async requireStoryRoot(storyId: string): Promise<string> {
    const root = await this.requireRoot();
    // 如果是 __root__，直接返回根目录
    if (storyId === "__root__") {
      return root;
    }
    const storyRoot = path.join(root, storyId);
    const stats = await fs.stat(storyRoot).catch(() => null);
    if (!stats || !stats.isDirectory()) {
      throw new Error(`目录不存在: ${storyId}`);
    }
    return storyRoot;
  }

  // 简化版本：直接返回根目录作为唯一的 "story"
  static async listStories(): Promise<DocStorySummary[]> {
    const root = await this.requireRoot();
    const metaPath = path.join(root, "meta.json");
    const meta = await readStoryMeta(metaPath);
    
    // 返回单个代表根目录的 story
    return [{
      id: "__root__",
      title: meta?.title || path.basename(root),
      description: meta?.description,
      hasMeta: Boolean(meta),
      metaPath,
    }];
  }

  private static async buildTree(
    storyRoot: string,
    meta: DocStoryMeta | null
  ): Promise<DocNavNode[]> {
    if (meta?.items?.length) {
      return meta.items.map((item) => normalizeMetaNode(item));
    }

    return scanDirectoryTree(storyRoot);
  }

  // 简化版本：直接从根目录构建文档树
  static async getStory(storyId: string): Promise<DocStory | null> {
    const root = await this.requireRoot();
    // 如果是 __root__，直接使用根目录
    const storyRoot = storyId === "__root__" ? root : path.join(root, storyId);
    
    const stats = await fs.stat(storyRoot).catch(() => null);
    if (!stats || !stats.isDirectory()) {
      throw new Error(`目录不存在: ${storyRoot}`);
    }
    
    const metaPath = path.join(storyRoot, "meta.json");
    const storedMeta = await readStoryMeta(metaPath);
    const meta = storedMeta || {
      title: path.basename(storyRoot),
      items: [],
    };
    const tree = await this.buildTree(storyRoot, meta);

    return {
      id: storyId,
      title: meta.title || path.basename(storyRoot),
      description: meta.description,
      hasMeta: Boolean(storedMeta),
      metaPath,
      root: storyRoot,
      tree,
      rawMeta: meta as Record<string, any>,
    };
  }

  static async readDoc(
    storyId: string,
    filePath: string
  ): Promise<DocFile> {
    const storyRoot = await this.requireStoryRoot(storyId);
    const normalized = sanitizeRelativePath(filePath);
    const target = path.resolve(storyRoot, normalized);
    if (!target.startsWith(path.resolve(storyRoot))) {
      throw new Error("非法路径");
    }

    const content = await fs.readFile(target, "utf-8");
    const { metadata, body } = parseFrontmatter(content);

    return {
      storyId,
      path: normalized,
      content: body,
      metadata,
    };
  }

  static async writeDoc(
    storyId: string,
    filePath: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<DocFile> {
    const storyRoot = await this.requireStoryRoot(storyId);
    const normalized = sanitizeRelativePath(filePath);
    const target = path.resolve(storyRoot, normalized);
    if (!target.startsWith(path.resolve(storyRoot))) {
      throw new Error("非法路径");
    }

    await fs.mkdir(path.dirname(target), { recursive: true });

    const composed = stringifyFrontmatter(content, metadata);
    await fs.writeFile(target, composed, "utf-8");

    return {
      storyId,
      path: normalized,
      content,
      metadata: metadata ?? {},
    };
  }

  static async saveMeta(payload: {
    storyId: string;
    tree: DocNavNode[];
    rawMeta: Record<string, any>;
  }): Promise<DocStory> {
    const storyRoot = await this.requireStoryRoot(payload.storyId);
    const metaPath = path.join(storyRoot, "meta.json");

    const meta: DocStoryMeta = {
      title: payload.rawMeta?.title || payload.storyId,
      description: payload.rawMeta?.description,
      ...payload.rawMeta,
      items: payload.tree,
    };

    await fs.mkdir(path.dirname(metaPath), { recursive: true });
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf-8");

    const tree = await this.buildTree(storyRoot, meta);

    return {
      id: payload.storyId,
      title: meta.title || payload.storyId,
      description: meta.description,
      hasMeta: true,
      metaPath,
      root: storyRoot,
      tree,
      rawMeta: meta as Record<string, any>,
    };
  }

  // 删除文档或文件夹
  static async deleteDoc(storyId: string, docPath: string): Promise<void> {
    const storyRoot = await this.requireStoryRoot(storyId);
    const normalized = sanitizeRelativePath(docPath);
    const target = path.resolve(storyRoot, normalized);
    
    if (!target.startsWith(path.resolve(storyRoot))) {
      throw new Error("非法路径");
    }

    const stats = await fs.stat(target).catch(() => null);
    if (!stats) {
      throw new Error("文件或文件夹不存在");
    }

    if (stats.isDirectory()) {
      await fs.rm(target, { recursive: true, force: true });
    } else {
      await fs.unlink(target);
    }
  }

  // 重排序文档 - 保存到 meta.json 的 pages 字段
  static async reorderDoc(
    storyId: string,
    activeId: string,
    overId: string
  ): Promise<void> {
    const storyRoot = await this.requireStoryRoot(storyId);
    
    // 获取当前目录结构
    const tree = await scanDirectoryTree(storyRoot);
    
    // 找到节点及其父列表
    const findNodeAndParent = (
      nodes: DocNavNode[],
      id: string
    ): { node: DocNavNode | null; parentList: DocNavNode[] | null } => {
      for (const node of nodes) {
        if (node.id === id) return { node, parentList: nodes };
        if (node.children) {
          const found = findNodeAndParent(node.children, id);
          if (found.node) return found;
        }
      }
      return { node: null, parentList: null };
    };

    const { node: activeNode, parentList: activeList } = findNodeAndParent(tree, activeId);
    const { node: overNode, parentList: overList } = findNodeAndParent(tree, overId);
    
    if (!activeNode || !activeList) {
      throw new Error("找不到要移动的项目");
    }
    if (!overNode || !overList) {
      throw new Error("找不到目标位置");
    }

    // 同一目录内排序
    if (activeList === overList) {
      const activeIndex = activeList.findIndex((n) => n.id === activeId);
      const overIndex = activeList.findIndex((n) => n.id === overId);
      
      if (activeIndex === -1 || overIndex === -1) return;

      // 重排序
      const [moved] = activeList.splice(activeIndex, 1);
      activeList.splice(overIndex, 0, moved);

      // 提取排序后的 ID 列表作为 pages
      const pages = activeList.map((n) => {
        const parts = n.id.split("/");
        return parts[parts.length - 1];
      });

      // 确定保存到哪个 meta.json
      const parentDir = activeNode.id.includes("/") 
        ? path.dirname(path.join(storyRoot, activeNode.id))
        : storyRoot;
      
      const targetMetaPath = path.join(parentDir, "meta.json");
      const targetMeta: Record<string, any> = await readStoryMeta(targetMetaPath) || {};
      
      targetMeta.pages = pages;
      
      await fs.mkdir(path.dirname(targetMetaPath), { recursive: true });
      await fs.writeFile(targetMetaPath, JSON.stringify(targetMeta, null, 2), "utf-8");
    } else {
      // 跨目录移动 - 暂不支持
      throw new Error("只能在同一目录内调整顺序");
    }
  }

  // 移动文档到目标文件夹
  static async moveDoc(
    storyId: string,
    sourceId: string,
    targetFolderId: string
  ): Promise<void> {
    const storyRoot = await this.requireStoryRoot(storyId);
    
    // 源文件/文件夹路径
    const sourcePath = path.join(storyRoot, sourceId);
    const sourceStats = await fs.stat(sourcePath).catch(() => null);
    
    if (!sourceStats) {
      throw new Error("源文件不存在");
    }

    // 目标文件夹路径
    const targetDir = path.join(storyRoot, targetFolderId);
    const targetStats = await fs.stat(targetDir).catch(() => null);
    
    if (!targetStats?.isDirectory()) {
      throw new Error("目标必须是文件夹");
    }

    // 获取源文件/文件夹名
    const sourceName = path.basename(sourcePath);
    const destPath = path.join(targetDir, sourceName);

    // 检查目标是否已存在
    const destExists = await fs.stat(destPath).catch(() => null);
    if (destExists) {
      throw new Error("目标位置已存在同名文件");
    }

    // 移动文件/文件夹
    await fs.rename(sourcePath, destPath);
  }
}
