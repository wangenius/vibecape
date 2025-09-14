import * as fs from 'fs-extra';
import * as path from 'path';
import { spawn } from 'child_process';
import { templates } from '../const';

export interface Template {
  description: string;
  url: string;
}

export class TemplateManager {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(__dirname, '../../templates');
  }

  async copyTemplate(templateName: string, targetPath: string): Promise<void> {
    const template = templates[templateName];

    if (!template) {
      throw new Error(`模板 ${templateName} 不存在`);
    }
    // 执行 git clone（兼容目标目录已存在且为空的情况）
    const targetExists = await fs.pathExists(targetPath);
    if (!targetExists) {
      await this.runCommand('git', ['clone', '--depth=1', template.url, targetPath], path.dirname(targetPath));
      // 移除模板仓库的 .git，避免把模板历史带入新项目
      await fs.remove(path.join(targetPath, '.git'));
    } else {
      const files = await fs.readdir(targetPath);
      if (files.length > 0) {
        throw new Error(`目标目录已存在且非空: ${targetPath}`);
      }
      const parentDir = path.dirname(targetPath);
      const tmpDir = path.join(parentDir, `.vibe_tmp_clone_${Date.now()}`);
      await this.runCommand('git', ['clone', '--depth=1', template.url, tmpDir], parentDir);
      // 移除模板仓库的 .git，避免把模板历史带入新项目
      await fs.remove(path.join(tmpDir, '.git'));
      await fs.copy(tmpDir, targetPath, { overwrite: true, errorOnExist: false });
      // 再次确保目标目录下没有 .git
      await fs.remove(path.join(targetPath, '.git'));
      await fs.remove(tmpDir);
    }
  }

  private runCommand(command: string, args: string[], cwd?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'inherit', cwd });
      child.on('error', reject);
      child.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${command} ${args.join(' ')} 退出码: ${code}`));
      });
    });
  }
}
