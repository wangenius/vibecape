import { SettingsService } from "../services/Settings";

/**
 * 代理配置
 */
let currentProxyConfig: { enabled: boolean; url: string } | null = null;

/**
 * 获取当前代理配置
 */
export async function getProxyConfig(): Promise<{
  enabled: boolean;
  url: string;
}> {
  if (currentProxyConfig) {
    return currentProxyConfig;
  }

  try {
    const settings = await SettingsService.get();
    currentProxyConfig =
      settings.general?.proxy || { enabled: false, url: "" };
    return currentProxyConfig;
  } catch (error) {
    console.error("获取代理配置失败:", error);
  }

  return { enabled: false, url: "" };
}

/**
 * 更新代理配置缓存
 */
export function updateProxyConfigCache(config: {
  enabled: boolean;
  url: string;
}) {
  currentProxyConfig = config;
  updateEnvironmentProxy(config);
}

/**
 * 更新环境变量中的代理配置
 */
export function updateEnvironmentProxy(config: {
  enabled: boolean;
  url: string;
}) {
  if (config.enabled && config.url) {
    process.env.HTTP_PROXY = config.url;
    process.env.HTTPS_PROXY = config.url;
    process.env.http_proxy = config.url;
    process.env.https_proxy = config.url;
    console.log(`[代理] 已启用代理: ${config.url}`);
  } else {
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    delete process.env.http_proxy;
    delete process.env.https_proxy;
    console.log("[代理] 已禁用代理");
  }
}

/**
 * 创建支持代理的 fetch 配置
 */
export async function createProxyFetchConfig(): Promise<{
  fetch?: typeof fetch;
}> {
  const proxyConfig = await getProxyConfig();

  if (!proxyConfig.enabled || !proxyConfig.url) {
    return {};
  }

  // 使用环境变量方式配置代理
  // AI SDK 会自动使用 process.env 中的代理设置
  updateEnvironmentProxy(proxyConfig);

  return {};
}

/**
 * 初始化代理配置
 */
export async function initProxyConfig() {
  const config = await getProxyConfig();
  updateEnvironmentProxy(config);
}
