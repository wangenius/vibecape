/**
 * 应用配置类型定义
 * 存储在 ~/vibecape/config.json
 */

// ==================== UI 配置 ====================

export type UIConfig = {
  theme: string;
  mode: "light" | "dark";
  follow_system_mode: boolean;
  language: string;
  prompt_language: string;
  show_chapter_list: boolean;
};

// ==================== 模型配置 ====================

export type ModelConfig = {
  primary: string;
  fast: string;
  image: string;
  video: string;
  voice: string;
};

// ==================== 代理配置 ====================

export type ProxyConfig = {
  enabled: boolean;
  url: string;
};

// ==================== MCP 配置 ====================

export type MCPServerConfig = {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
};

export type MCPConfig = {
  enabled: boolean;
  servers: MCPServerConfig[];
};

// ==================== OSS 配置 ====================

export type OSSConfig = {
  enabled: boolean;
  provider: "aliyun" | "qiniu" | "tencent" | "s3";
  region: string;
  bucket: string;
  access_key_id: string;
  access_key_secret: string;
  endpoint: string;
  custom_domain: string;
};

// ==================== 应用配置 ====================

export type AppConfig = {
  ui: UIConfig;
  model: ModelConfig;
  proxy: ProxyConfig;
  oss: OSSConfig;
};

// ==================== 默认值 ====================

export const DEFAULT_UI_CONFIG: UIConfig = {
  theme: "default",
  mode: "light",
  follow_system_mode: false,
  language: "en",
  prompt_language: "en",
  show_chapter_list: true,
};

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  primary: "",
  fast: "",
  image: "",
  video: "",
  voice: "",
};

export const DEFAULT_PROXY_CONFIG: ProxyConfig = {
  enabled: false,
  url: "",
};

export const DEFAULT_OSS_CONFIG: OSSConfig = {
  enabled: false,
  provider: "aliyun",
  region: "",
  bucket: "",
  access_key_id: "",
  access_key_secret: "",
  endpoint: "",
  custom_domain: "",
};

export const DEFAULT_MCP_CONFIG: MCPConfig = {
  enabled: false,
  servers: [],
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  ui: DEFAULT_UI_CONFIG,
  model: DEFAULT_MODEL_CONFIG,
  proxy: DEFAULT_PROXY_CONFIG,
  oss: DEFAULT_OSS_CONFIG,
};
