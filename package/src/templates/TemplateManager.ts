import * as fs from "fs-extra";
import * as path from "path";
import { spawn } from "child_process";

export type Template = {
  name: string;
  description?: string;
  url?: string;

  /**
   *
   * @param dirpath 当前项目的绝对路径
   * @returns
   */
  execute?: (dirpath: string) => Promise<void>;
};

export class TemplateManager {
  private static registry: Record<string, Template> = {};

  constructor() {}

  static registerTemplate(t: Template): void {
    this.registry[t.name] = t;
  }

  static getAllTemplates(): Record<string, Template> {
    return this.registry;
  }

  async copyTemplate(templateName: string, targetPath: string): Promise<void> {
    const template = TemplateManager.registry[templateName];

    if (!template) {
      throw new Error(`模板 ${templateName} 不存在`);
    }
    // 如果提供了 url，沿用当前的 git clone 逻辑
    if (template.url) {
      const targetExists = await fs.pathExists(targetPath);
      if (!targetExists) {
        await this.runCommand(
          "git",
          ["clone", "--depth=1", template.url, targetPath],
          path.dirname(targetPath)
        );
        // 移除模板仓库的 .git，避免把模板历史带入新项目
        await fs.remove(path.join(targetPath, ".git"));
      } else {
        const files = await fs.readdir(targetPath);
        if (files.length > 0) {
          throw new Error(`目标目录已存在且非空: ${targetPath}`);
        }
        const parentDir = path.dirname(targetPath);
        const tmpDir = path.join(parentDir, `.vibe_tmp_clone_${Date.now()}`);
        await this.runCommand(
          "git",
          ["clone", "--depth=1", template.url, tmpDir],
          parentDir
        );
        // 移除模板仓库的 .git，避免把模板历史带入新项目
        await fs.remove(path.join(tmpDir, ".git"));
        await fs.copy(tmpDir, targetPath, {
          overwrite: true,
          errorOnExist: false,
        });
        // 再次确保目标目录下没有 .git
        await fs.remove(path.join(targetPath, ".git"));
        await fs.remove(tmpDir);
      }
      return;
    }

    // 否则如果是本地模板：先确保目录存在，然后在该目录下执行 execute
    await fs.ensureDir(targetPath);
    if (template.execute) {
      const prevCwd = process.cwd();
      try {
        process.chdir(targetPath);
        await template.execute(targetPath);
      } finally {
        process.chdir(prevCwd);
      }
    } else {
      throw new Error(`模板 ${templateName} 未提供 url 或 execute`);
    }
  }

  private runCommand(
    command: string,
    args: string[],
    cwd?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: "inherit", cwd });
      child.on("error", reject);
      child.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${command} ${args.join(" ")} 退出码: ${code}`));
      });
    });
  }
}

export function createTemplate(input: Template): void {
  const { name, description, url, execute } = input;
  if (!url && !execute) {
    throw new Error(`模板 ${name} 需要提供 url 或 execute 其中之一`);
  }
  TemplateManager.registerTemplate({ name, description, url, execute });
}

// 侧效导入，注册内置模板
import "./instances";
