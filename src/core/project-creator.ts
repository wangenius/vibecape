import * as fs from 'fs-extra';
import * as path from 'path';
import { spawn } from 'child_process';
import { TemplateManager } from './template-manager';
import { ConfigManager } from './config-manager';

export interface ProjectConfig {
  name: string;
  template: string;
  packageManager: string;
  typescript: boolean;
  tailwind: boolean;
  eslint: boolean;
  path: string;
}

export class ProjectCreator {
  private templateManager: TemplateManager;
  private configManager: ConfigManager;

  constructor() {
    this.templateManager = new TemplateManager();
    this.configManager = new ConfigManager();
  }

  async create(config: ProjectConfig): Promise<void> {
    // 创建项目目录
    await fs.ensureDir(config.path);

    // 复制模板文件
    await this.templateManager.copyTemplate(config.template, config.path);

    // 更新项目配置
    await this.updateProjectFiles(config);

    // 生成配置文件
    await this.generateConfigFiles(config);

    // 安装依赖
    await this.installDependencies(config);
  }

  private async updateProjectFiles(config: ProjectConfig): Promise<void> {
    // 更新 package.json
    const packageJsonPath = path.join(config.path, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = config.name;
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }

    // 如果不使用 TypeScript，转换文件
    if (!config.typescript) {
      await this.convertToJavaScript(config.path);
    }
  }

  private async generateConfigFiles(config: ProjectConfig): Promise<void> {
    // 生成 vibe.config.js
    const vibeConfig = {
      project: {
        name: config.name,
        version: '1.0.0',
        template: config.template
      },
      integrations: {},
      settings: {
        packageManager: config.packageManager,
        typescript: config.typescript,
        tailwind: config.tailwind,
        eslint: config.eslint
      }
    };

    await fs.writeJson(
      path.join(config.path, 'vibe.config.json'),
      vibeConfig,
      { spaces: 2 }
    );
  }

  private async installDependencies(config: ProjectConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const installCommand = config.packageManager === 'yarn' ? 'yarn' : 
                           config.packageManager === 'pnpm' ? 'pnpm install' : 'npm install';
      
      const child = spawn(installCommand, [], {
        cwd: config.path,
        stdio: 'inherit',
        shell: true
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`依赖安装失败，退出码: ${code}`));
        }
      });
    });
  }

  private async convertToJavaScript(projectPath: string): Promise<void> {
    // 将 .ts 文件转换为 .js 文件的逻辑
    // 这里简化处理，实际项目中需要更复杂的转换逻辑
    const tsFiles = await this.findFiles(projectPath, /\.ts$/);
    
    for (const file of tsFiles) {
      const jsFile = file.replace(/\.ts$/, '.js');
      await fs.move(file, jsFile);
    }
  }

  private async findFiles(dir: string, pattern: RegExp): Promise<string[]> {
    const files: string[] = [];
    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        files.push(...await this.findFiles(fullPath, pattern));
      } else if (pattern.test(item)) {
        files.push(fullPath);
      }
    }

    return files;
  }
} 