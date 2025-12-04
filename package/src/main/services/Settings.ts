/**
 * 应用配置服务
 * 读写 ~/vibecape/config.json
 */

import { type AppConfig, DEFAULT_APP_CONFIG } from "@common/schema/config";
import { getAppConfig, setAppConfig, updateAppConfig } from "./UserData";
import { setShape, type Shape } from "@common/lib/shape";

export class SettingsService {
  private static cache: AppConfig = DEFAULT_APP_CONFIG;
  private static initialized = false;

  /**
   * 初始化配置服务
   */
  static init(): void {
    if (this.initialized) return;
    this.cache = getAppConfig();
    this.initialized = true;
    console.log("[SettingsService] Loaded config from JSON");
  }

  /**
   * 获取缓存的配置
   */
  static getCache(): AppConfig {
    if (!this.initialized) {
      this.init();
    }
    return this.cache;
  }

  /**
   * 获取配置 (同步)
   */
  static get(): AppConfig {
    if (!this.initialized) {
      this.init();
    }
    return this.cache;
  }

  /**
   * 更新配置 (支持路径更新)
   */
  static update(path: Shape, value: unknown): AppConfig {
    if (!this.initialized) {
      this.init();
    }

    console.log("[SettingsService] Updating path:", path, "value:", value);

    this.cache = setShape(this.cache, path, value);
    setAppConfig(this.cache);

    console.log("[SettingsService] Config saved to JSON");
    return this.cache;
  }

  /**
   * 更新整个配置分类
   */
  static updateSection<K extends keyof AppConfig>(
    key: K,
    value: Partial<AppConfig[K]>
  ): AppConfig {
    if (!this.initialized) {
      this.init();
    }

    this.cache = updateAppConfig(key, value);
    return this.cache;
  }

  /**
   * 重置为默认配置
   */
  static reset(): AppConfig {
    this.cache = DEFAULT_APP_CONFIG;
    setAppConfig(this.cache);
    console.log("[SettingsService] Config reset to defaults");
    return this.cache;
  }
}
