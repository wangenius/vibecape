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
  type RepositorysIndex,
  type RepositoryEntry,
  DEFAULT_REPOSITORYS_INDEX,
} from "@common/schema/repository";

// ==================== 路径常量 ====================

const VIBECAPE_DIR = path.join(os.homedir(), "vibecape");
const CONFIG_PATH = path.join(VIBECAPE_DIR, "config.json");
const MCP_PATH = path.join(VIBECAPE_DIR, "mcp.json");
const REPOSITORYS_PATH = path.join(VIBECAPE_DIR, "repositorys.json");
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
    repositorysPath: REPOSITORYS_PATH,
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

// ==================== RepositorysIndex 操作 ====================

export function getRepositorysIndex(): RepositorysIndex {
  const stored = readJsonFile<Partial<RepositorysIndex>>(REPOSITORYS_PATH, {});
  return {
    // 如果没有配置 docs_root，使用默认路径
    docs_root: stored.docs_root || DEFAULT_DOCS_ROOT,
    current: stored.current ?? DEFAULT_REPOSITORYS_INDEX.current,
    recent: stored.recent ?? DEFAULT_REPOSITORYS_INDEX.recent,
  };
}

export function setRepositorysIndex(index: RepositorysIndex): void {
  writeJsonFile(REPOSITORYS_PATH, index);
}

export function getDocsRoot(): string {
  return getRepositorysIndex().docs_root;
}

export function setDocsRoot(docsRoot: string): void {
  const index = getRepositorysIndex();
  index.docs_root = docsRoot;
  setRepositorysIndex(index);
}

export function getCurrentRepositoryId(): string | null {
  return getRepositorysIndex().current;
}

export function setCurrentRepositoryId(id: string | null): void {
  const index = getRepositorysIndex();
  index.current = id;
  setRepositorysIndex(index);
}

export function getRecentRepositorys(): RepositoryEntry[] {
  return getRepositorysIndex().recent;
}

export function addRecentRepository(entry: RepositoryEntry): void {
  const index = getRepositorysIndex();
  // 移除已存在的同 ID 条目
  index.recent = index.recent.filter((e) => e.id !== entry.id);
  // 添加到开头
  index.recent.unshift(entry);
  // 保留最近 20 个
  index.recent = index.recent.slice(0, 20);
  setRepositorysIndex(index);
}

export function removeRecentRepository(id: string): void {
  const index = getRepositorysIndex();
  index.recent = index.recent.filter((e) => e.id !== id);
  if (index.current === id) {
    index.current = null;
  }
  setRepositorysIndex(index);
}

export function updateRecentRepository(id: string, updates: Partial<RepositoryEntry>): void {
  const index = getRepositorysIndex();
  const entry = index.recent.find((e) => e.id === id);
  if (entry) {
    Object.assign(entry, updates);
    setRepositorysIndex(index);
  }
}
