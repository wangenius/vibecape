import * as fs from "fs-extra";
import * as path from "path";

export interface HealthResult {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
  suggestions?: string[];
}

export class HealthChecker {
  async checkAll(): Promise<HealthResult[]> {
    const results: HealthResult[] = [];

    results.push(await this.checkNodeVersion());
    results.push(await this.checkPackageJson());
    results.push(await this.checkVibeConfig());
    results.push(await this.checkGitRepository());
    results.push(await this.checkDependencies());

    return results;
  }

  private async checkNodeVersion(): Promise<HealthResult> {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);

    if (majorVersion >= 18) {
      return {
        name: "Node.js 版本",
        status: "pass",
        message: `Node.js ${nodeVersion} (支持)`,
      };
    } else {
      return {
        name: "Node.js 版本",
        status: "fail",
        message: `Node.js ${nodeVersion} (不支持)`,
        suggestions: ["请升级到 Node.js 18 或更高版本"],
      };
    }
  }

  private async checkPackageJson(): Promise<HealthResult> {
    const packageJsonPath = path.join(process.cwd(), "package.json");

    if (await fs.pathExists(packageJsonPath)) {
      return {
        name: "package.json",
        status: "pass",
        message: "package.json 文件存在",
      };
    } else {
      return {
        name: "package.json",
        status: "fail",
        message: "package.json 文件不存在",
        suggestions: ["运行 npm init 创建 package.json"],
      };
    }
  }

  private async checkVibeConfig(): Promise<HealthResult> {
    const configPath = path.join(process.cwd(), "vibe.config.json");

    if (await fs.pathExists(configPath)) {
      return {
        name: "Vibe 配置",
        status: "pass",
        message: "vibe.config.json 配置文件存在",
      };
    } else {
      return {
        name: "Vibe 配置",
        status: "warn",
        message: "vibe.config.json 配置文件不存在",
        suggestions: ["运行 vibe create 创建新项目"],
      };
    }
  }

  private async checkGitRepository(): Promise<HealthResult> {
    const gitPath = path.join(process.cwd(), ".git");

    if (await fs.pathExists(gitPath)) {
      return {
        name: "Git 仓库",
        status: "pass",
        message: "Git 仓库已初始化",
      };
    } else {
      return {
        name: "Git 仓库",
        status: "warn",
        message: "Git 仓库未初始化",
        suggestions: ["运行 git init 初始化 Git 仓库"],
      };
    }
  }

  private async checkDependencies(): Promise<HealthResult> {
    const nodeModulesPath = path.join(process.cwd(), "node_modules");

    if (await fs.pathExists(nodeModulesPath)) {
      return {
        name: "依赖安装",
        status: "pass",
        message: "依赖包已安装",
      };
    } else {
      return {
        name: "依赖安装",
        status: "warn",
        message: "依赖包未安装",
        suggestions: ["运行 npm install 安装依赖包"],
      };
    }
  }
}
