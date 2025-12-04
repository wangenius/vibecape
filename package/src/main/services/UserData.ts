/**
 * 用户数据服务
 * 管理 ~/vibecape/ 目录下的配置文件
 */

import fs from "fs";
import path from "path";
import os from "os";
import {
  type AppConfig,
  type MCPConfig,
  DEFAULT_APP_CONFIG,
  DEFAULT_MCP_CONFIG,
} from "@common/schema/config";
import {
  type WorkspacesIndex,
  type WorkspaceEntry,
  DEFAULT_WORKSPACES_INDEX,
} from "@common/schema/workspace";

// ==================== 路径常量 ====================

const VIBECAPE_DIR = path.join(os.homedir(), "vibecape");
const CONFIG_PATH = path.join(VIBECAPE_DIR, "config.json");
const MCP_PATH = path.join(VIBECAPE_DIR, "mcp.json");
const WORKSPACES_PATH = path.join(VIBECAPE_DIR, "workspaces.json");
const CACHE_DIR = path.join(VIBECAPE_DIR, "cache");
const DEFAULT_DOCS_ROOT = path.join(VIBECAPE_DIR, "root");

// ==================== 工具函数 ====================

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`[UserData] Failed to read ${filePath}:`, error);
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function mergeDeep<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key];
    const targetValue = target[key];
    if (
      sourceValue !== undefined &&
      typeof sourceValue === "object" &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === "object" &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = mergeDeep(targetValue, sourceValue as any);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T];
    }
  }
  return result;
}

// ==================== 初始化 ====================

export function initUserDataDir(): void {
  ensureDir(VIBECAPE_DIR);
  ensureDir(CACHE_DIR);
  ensureDir(DEFAULT_DOCS_ROOT);
  console.log("[UserData] User data directory initialized:", VIBECAPE_DIR);
}

// ==================== 路径导出 ====================

export function getUserDataPaths() {
  return {
    vibecapeDir: VIBECAPE_DIR,
    configPath: CONFIG_PATH,
    mcpPath: MCP_PATH,
    workspacesPath: WORKSPACES_PATH,
    cacheDir: CACHE_DIR,
  };
}

// ==================== MCPConfig 操作 ====================

export function getMCPConfig(): MCPConfig {
  const stored = readJsonFile<Partial<MCPConfig>>(MCP_PATH, {});
  return {
    enabled: stored.enabled ?? DEFAULT_MCP_CONFIG.enabled,
    servers: stored.servers ?? DEFAULT_MCP_CONFIG.servers,
  };
}

export function setMCPConfig(config: MCPConfig): void {
  writeJsonFile(MCP_PATH, config);
}

// ==================== AppConfig 操作 ====================

export function getAppConfig(): AppConfig {
  const stored = readJsonFile<Partial<AppConfig>>(CONFIG_PATH, {});
  return mergeDeep(DEFAULT_APP_CONFIG, stored);
}

export function setAppConfig(config: AppConfig): void {
  writeJsonFile(CONFIG_PATH, config);
}

export function updateAppConfig<K extends keyof AppConfig>(
  key: K,
  value: Partial<AppConfig[K]>
): AppConfig {
  const config = getAppConfig();
  config[key] = mergeDeep(config[key], value);
  setAppConfig(config);
  return config;
}

// ==================== WorkspacesIndex 操作 ====================

export function getWorkspacesIndex(): WorkspacesIndex {
  const stored = readJsonFile<Partial<WorkspacesIndex>>(WORKSPACES_PATH, {});
  return {
    // 如果没有配置 docs_root，使用默认路径
    docs_root: stored.docs_root || DEFAULT_DOCS_ROOT,
    current: stored.current ?? DEFAULT_WORKSPACES_INDEX.current,
    recent: stored.recent ?? DEFAULT_WORKSPACES_INDEX.recent,
  };
}

export function setWorkspacesIndex(index: WorkspacesIndex): void {
  writeJsonFile(WORKSPACES_PATH, index);
}

export function getDocsRoot(): string {
  return getWorkspacesIndex().docs_root;
}

export function setDocsRoot(docsRoot: string): void {
  const index = getWorkspacesIndex();
  index.docs_root = docsRoot;
  setWorkspacesIndex(index);
}

export function getCurrentWorkspaceId(): string | null {
  return getWorkspacesIndex().current;
}

export function setCurrentWorkspaceId(id: string | null): void {
  const index = getWorkspacesIndex();
  index.current = id;
  setWorkspacesIndex(index);
}

export function getRecentWorkspaces(): WorkspaceEntry[] {
  return getWorkspacesIndex().recent;
}

export function addRecentWorkspace(entry: WorkspaceEntry): void {
  const index = getWorkspacesIndex();
  // 移除已存在的同 ID 条目
  index.recent = index.recent.filter((e) => e.id !== entry.id);
  // 添加到开头
  index.recent.unshift(entry);
  // 保留最近 20 个
  index.recent = index.recent.slice(0, 20);
  setWorkspacesIndex(index);
}

export function removeRecentWorkspace(id: string): void {
  const index = getWorkspacesIndex();
  index.recent = index.recent.filter((e) => e.id !== id);
  if (index.current === id) {
    index.current = null;
  }
  setWorkspacesIndex(index);
}

export function updateRecentWorkspace(id: string, updates: Partial<WorkspaceEntry>): void {
  const index = getWorkspacesIndex();
  const entry = index.recent.find((e) => e.id === id);
  if (entry) {
    Object.assign(entry, updates);
    setWorkspacesIndex(index);
  }
}
