/**
 * 工作区类型定义
 *
 * 用户目录: ~/vibecape/workspaces.json
 * 工作区目录: {docs_root}/{workspace_id}/
 */

import { WorkspaceConfig } from "./workspace_config";

// 重新导出配置相关类型，保持向后兼容
export * from "./workspace_config";

// ==================== 工作区索引 (~/vibecape/workspaces.json) ====================

/**
 * 工作区索引条目
 * 用于在工作区列表中快速显示和访问
 */
export type WorkspaceEntry = {
  /** 工作区唯一标识符 */
  id: string;
  /** 工作区显示名称 */
  name: string;
  /** 最后打开时间戳（毫秒） */
  last_opened_at: number;
};

/**
 * 工作区索引
 * 存储在 ~/vibecape/workspaces.json
 */
export type WorkspacesIndex = {
  /** 文档根目录路径，所有工作区都存储在此目录下 */
  docs_root: string;
  /** 当前活动工作区 ID，null 表示无活动工作区 */
  current: string | null;
  /** 最近访问的工作区列表，按访问时间排序 */
  recent: WorkspaceEntry[];
};

/** 默认 docs_root 路径 (会在运行时被替换为实际路径) */
export const DEFAULT_DOCS_ROOT = ""; // 实际默认值在 UserData.ts 中设置

/** 默认工作区索引 */
export const DEFAULT_WORKSPACES_INDEX: WorkspacesIndex = {
  docs_root: DEFAULT_DOCS_ROOT,
  current: null,
  recent: [],
};

// ==================== 工作区信息 (运行时) ====================

/**
 * 工作区运行时信息
 * 包含工作区的完整路径信息和配置
 */
export type Workspace = {
  /** 工作区唯一标识符 */
  id: string;
  /** 工作区目录路径 {docs_root}/{id} */
  path: string;
  /** config.json 完整路径 */
  config_path: string;
  /** docs.db 完整路径 */
  docs_db_path: string;
  /** chat.db 完整路径 */
  chat_db_path: string;
  /** llm.txt 完整路径 */
  llm_txt_path: string;
  /** 工作区配置 */
  config: WorkspaceConfig;
};

// ==================== 常量 ====================

/** 工作区目录下的文件名常量 */
export const WORKSPACE_FILES = {
  /** 工作区配置文件 */
  CONFIG: "config.json",
  /** 文档数据库文件 */
  DOCS_DB: "docs.db",
  /** 聊天数据库文件 */
  CHAT_DB: "chat.db",
  /** LLM 上下文文件 */
  LLM_TXT: "llm.txt",
} as const;
