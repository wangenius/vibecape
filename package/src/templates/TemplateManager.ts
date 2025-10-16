import * as fs from "fs-extra";
import * as path from "path";
import shell from "shelljs";

type TemplateExecuteParams = {
  // 当前项目的绝对路径
  path: string;
};

// 模板定义
export type Template = {
  // 名称
  name: string;
  // 描述
  description: string;
  // git 仓库地址: 如果有url，需要执行 git clone
  url?: string;
  /**
   * execute 函数：如果没有 url，则执行该函数来生成项目文件
   */
  execute?: (params: TemplateExecuteParams) => Promise<void>;
};

/**
 *  TemplateManager 负责模板的注册和使用
 */
export class TemplateManager {
  // 模板注册表
  private static registry: Record<string, Template> = {};

  static register(t: Template): void {
    this.registry[t.name] = t;
  }

  static getAll(): Record<string, Template> {
    return this.registry;
  }

  static get(name: string): Template {
    const template = this.registry[name];
    if (!template) {
      throw new Error(`模板 ${name} 不存在`);
    }
    return template;
  }

  static async copy(templateName: string, targetPath: string): Promise<void> {
    const template = TemplateManager.get(templateName);
    // 确保目标目录存在
    await fs.ensureDir(targetPath);
    // 如果提供了 url，沿用当前的 git clone 逻辑
    if (template.url) {
      process.chdir(targetPath);
      // 直接克隆到目标目录
      shell.exec(`git clone --depth=1 ${template.url}`);
      // 移除模板仓库的 .git，避免把模板历史带入新项目
      shell.rm("-rf", path.join(targetPath, ".git"));
      // 将克隆的地址下的所有文件移动到目标目录
      const files = await fs.readdir(targetPath);
      for (const file of files) {
        if (file === ".git") continue;
        await fs.move(
          path.join(targetPath, file),
          path.join(targetPath, file),
          {
            overwrite: true,
          }
        );
      }
    }

    // 否则如果是本地模板：先确保目录存在，然后在该目录下执行 execute
    if (template.execute) {
      const prevCwd = process.cwd();
      try {
        process.chdir(targetPath);
        await template.execute({ path: targetPath });
      } finally {
        process.chdir(prevCwd);
      }
    } else {
      throw new Error(`模板 ${templateName} 未提供 url 或 execute`);
    }
  }
}

export function createTemplate(input: Template): void {
  const { name, description, url, execute } = input;
  if (!url && !execute) {
    throw new Error(`模板 ${name} 需要提供 url 或 execute 其中之一`);
  }
  TemplateManager.register({ name, description, url, execute });
}

// 侧效导入，注册内置模板
import "./instances";
