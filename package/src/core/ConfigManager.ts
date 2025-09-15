import * as fs from 'fs-extra';
import * as path from 'path';

export interface VibeConfig {
  project: {
    name: string;
    version: string;
    template: string;
  };
  integrations: Record<string, IntegrationConfig>;
  settings: {
    packageManager: string;
    typescript: boolean;
    tailwind: boolean;
    eslint: boolean;
  };
}

export interface IntegrationConfig {
  provider: string;
  version: string;
  // Free-form provider-specific configuration object
  config: Record<string, unknown>;
}


// ConfigManager
export class ConfigManager {
  private configPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), 'vibe.config.json');
  }

  async getConfig(): Promise<VibeConfig> {
    if (await fs.pathExists(this.configPath)) {
      return await fs.readJson(this.configPath);
    }

    // 返回默认配置
    return {
      project: {
        name: 'vibe-project',
        version: '1.0.0',
        template: 'basic-saas'
      },
      integrations: {},
      settings: {
        packageManager: 'npm',
        typescript: true,
        tailwind: true,
        eslint: true
      }
    };
  }

  async setConfig(key: string, value: unknown): Promise<void> {
    const config = await this.getConfig();
    
    // 支持嵌套键，如 'project.name'
    const keys = key.split('.');
    let current: Record<string, unknown> | unknown = config as unknown as Record<string, unknown>;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (typeof current !== 'object' || current === null) break;
      const obj = current as Record<string, unknown>;
      if (!(keys[i] in obj) || typeof obj[keys[i]] !== 'object' || obj[keys[i]] === null) {
        obj[keys[i]] = {} as Record<string, unknown>;
      }
      current = (obj[keys[i]] as Record<string, unknown>);
    }
    
    if (typeof current === 'object' && current !== null) {
      (current as Record<string, unknown>)[keys[keys.length - 1]] = value;
    }
    
    await fs.writeJson(this.configPath, config, { spaces: 2 });
  }

  async getConfigValue<T = unknown>(key: string): Promise<T | undefined> {
    const config = await this.getConfig();
    
    const keys = key.split('.');
    let current: unknown = config;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }
    
    return current as T;
  }

  async addIntegration(type: string, provider: string, config: Record<string, unknown>): Promise<void> {
    const vibeConfig = await this.getConfig();
    
    vibeConfig.integrations[type] = {
      provider,
      version: '1.0.0',
      config
    };
    
    await fs.writeJson(this.configPath, vibeConfig, { spaces: 2 });
  }
}
