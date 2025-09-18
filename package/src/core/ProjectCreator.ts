import * as fs from "fs-extra";
import * as path from "path";
import { TemplateManager } from "../templates/TemplateManager";

export class ProjectCreator {
  private templateManager: TemplateManager;
  private projectName: string;
  private projectPath: string;

  constructor(projectName: string) {
    this.templateManager = new TemplateManager();

    this.projectName = projectName;
    this.projectPath = path.resolve(process.cwd(), projectName);
  }

  async create(template: string): Promise<void> {
    // 创建项目目录
    await fs.ensureDir(this.projectPath);

    // 复制模板文件
    await this.templateManager.copyTemplate(template, this.projectPath);

    // 更新项目配置
    await this.updateProjectFiles();

    // 生成配置文件
    await this.generateConfigFiles();
  }

  private async updateProjectFiles(): Promise<void> {
    // 更新 package.json
    const packageJsonPath = path.join(this.projectPath, "package.json");
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = this.projectName;
      packageJson.version = "1.0.0";
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }
  }

  private async generateConfigFiles(): Promise<void> {
    // 生成 vibe.config.js
    const vibeConfig = {
      project: {
        name: this.projectName,
        version: "1.0.0",
        template: "default",
      },
      integrations: {},
      settings: {
        packageManager: "npm",
        typescript: true,
        tailwind: true,
        eslint: true,
      },
    };

    await fs.writeJson(
      path.join(this.projectPath, "vibe.config.json"),
      vibeConfig,
      {
        spaces: 2,
      }
    );
  }
}
