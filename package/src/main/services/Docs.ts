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

async function scanDirectoryTree(
  storyRoot: string,
  current: string = storyRoot
): Promise<DocNavNode[]> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const nodes: DocNavNode[] = [];

  // 先目录后文件，保持导航顺序
  entries.sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()));

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(current, entry.name);
    const relative = path.relative(storyRoot, fullPath);

    if (entry.isDirectory()) {
      const children = await scanDirectoryTree(storyRoot, fullPath);
      if (children.length > 0) {
        nodes.push({
          id: relative,
          title: entry.name,
          type: "group",
          children,
        });
      }
    } else if (isDocFile(entry.name)) {
      nodes.push({
        id: relative,
        title: entry.name.replace(path.extname(entry.name), ""),
        type: "doc",
        path: relative,
      });
    }
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
    const storyRoot = path.join(root, storyId);
    const stats = await fs.stat(storyRoot).catch(() => null);
    if (!stats || !stats.isDirectory()) {
      throw new Error(`Story 目录不存在: ${storyId}`);
    }
    return storyRoot;
  }

  static async listStories(): Promise<DocStorySummary[]> {
    const root = await this.requireRoot();
    const entries = await fs.readdir(root, { withFileTypes: true });
    const stories: DocStorySummary[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      const storyRoot = path.join(root, entry.name);
      const metaPath = path.join(storyRoot, "meta.json");
      const meta = await readStoryMeta(metaPath);
      stories.push({
        id: entry.name,
        title: meta?.title || entry.name,
        description: meta?.description,
        hasMeta: Boolean(meta),
        metaPath,
      });
    }

    return stories;
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

  static async getStory(storyId: string): Promise<DocStory | null> {
    const storyRoot = await this.requireStoryRoot(storyId);
    const metaPath = path.join(storyRoot, "meta.json");
    const storedMeta = await readStoryMeta(metaPath);
    const meta = storedMeta || {
      title: storyId,
      items: [],
    };
    const tree = await this.buildTree(storyRoot, meta);

    return {
      id: storyId,
      title: meta.title || storyId,
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
}
