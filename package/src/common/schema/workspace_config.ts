/**
 * 工作区配置类型定义
 *
 * 存储位置: {docs_root}/{workspace_id}/config.json
 * 每个工作区独立维护自己的配置文件
 */

// ==================== 资源配置 ====================

/**
 * 资源上传与存储配置
 */
export type WorkspaceAssetConfig = {
  /**
   * 资源上传优先级策略
   * - "oss-first": 优先上传到 OSS，失败时回退到本地
   * - "local-first": 优先保存到本地，手动触发上传到 OSS
   */
  upload_priority: "oss-first" | "local-first";
};

// ==================== 关联配置 ====================

/**
 * 关联目标类型
 * - fumadocs: Fumadocs 文档框架
 * - docusaurus: Docusaurus 文档框架
 * - feishu: 飞书文档
 */
export type LinkTargetType = "fumadocs" | "docusaurus" | "feishu";

/**
 * 工作区关联配置
 * 用于将工作区与外部文档系统关联
 */
export type WorkspaceLinkConfig = {
  /**
   * 是否启用关联
   */
  enabled: boolean;

  /**
   * 关联目标类型
   */
  target: LinkTargetType;

  /**
   * 文档目录路径
   * 例如: /Users/xxx/project/content/docs
   */
  docs_path: string;

  /**
   * 文档引用资源目录路径
   * 例如: /Users/xxx/project/public/images
   */
  assets_path: string;
};

// ==================== 工作区配置 ====================

/**
 * 工作区完整配置
 * 存储在 {docs_root}/{workspace_id}/config.json
 */
export type WorkspaceConfig = {
  /** 工作区名称 */
  name: string;

  /** 资源配置 */
  asset: WorkspaceAssetConfig;

  /** 关联配置 */
  link: WorkspaceLinkConfig;
};

// ==================== 默认值 ====================

/** 默认资源配置 */
export const DEFAULT_WORKSPACE_ASSET_CONFIG: WorkspaceAssetConfig = {
  upload_priority: "local-first",
};

/** 默认关联配置 */
export const DEFAULT_WORKSPACE_LINK_CONFIG: WorkspaceLinkConfig = {
  enabled: false,
  target: "fumadocs",
  docs_path: "",
  assets_path: "",
};

/**
 * 创建默认工作区配置
 * @param name 工作区名称
 */
export const createDefaultWorkspaceConfig = (name: string): WorkspaceConfig => {
  return {
    name,
    asset: DEFAULT_WORKSPACE_ASSET_CONFIG,
    link: DEFAULT_WORKSPACE_LINK_CONFIG,
  };
};
