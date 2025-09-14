import * as fs from 'fs-extra';
import * as path from 'path';

export interface VibeConfig {
  project: {
    name: string;
    version: string;
    template: string;
  };
  integrations: Record<string, any>;
  settings: {
    packageManager: string;
    typescript: boolean;
    tailwind: boolean;
    eslint: boolean;
  };
}

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

  async setConfig(key: string, value: any): Promise<void> {
    const config = await this.getConfig();
    
    // 支持嵌套键，如 'project.name'
    const keys = key.split('.');
    let current: any = config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    
    await fs.writeJson(this.configPath, config, { spaces: 2 });
  }

  async getConfigValue(key: string): Promise<any> {
    const config = await this.getConfig();
    
    const keys = key.split('.');
    let current: any = config;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  async addIntegration(type: string, provider: string, config: any): Promise<void> {
    const vibeConfig = await this.getConfig();
    
    vibeConfig.integrations[type] = {
      provider,
      version: '1.0.0',
      config
    };
    
    await fs.writeJson(this.configPath, vibeConfig, { spaces: 2 });
  }
} 