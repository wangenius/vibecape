import * as fs from 'fs-extra';
import * as path from 'path';

export interface Template {
  name: string;
  displayName: string;
  description: string;
  path: string;
}

export class TemplateManager {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(__dirname, '../../templates');
  }

  async getAvailableTemplates(): Promise<Template[]> {
    const templates: Template[] = [
      {
        name: 'ai-saas',
        displayName: 'AI SaaS Template',
        description: 'AI驱动的SaaS应用模板，包含用户认证、支付、AI集成',
        path: path.join(this.templatesDir, 'ai-saas')
      },
      {
        name: 'basic-saas',
        displayName: 'Basic SaaS Template',
        description: '基础SaaS应用模板，包含用户管理、仪表板',
        path: path.join(this.templatesDir, 'basic-saas')
      },
      {
        name: 'e-commerce',
        displayName: 'E-commerce Template',
        description: '电商应用模板，包含商品管理、购物车、支付',
        path: path.join(this.templatesDir, 'e-commerce')
      }
    ];

    return templates;
  }

  async copyTemplate(templateName: string, targetPath: string): Promise<void> {
    const templates = await this.getAvailableTemplates();
    const template = templates.find(t => t.name === templateName);
    
    if (!template) {
      throw new Error(`模板 ${templateName} 不存在`);
    }

    // 确保模板目录存在
    if (!await fs.pathExists(template.path)) {
      // 如果模板不存在，创建一个基础模板
      await this.createBasicTemplate(targetPath);
      return;
    }

    // 复制模板文件
    await fs.copy(template.path, targetPath);
  }

  private async createBasicTemplate(targetPath: string): Promise<void> {
    // 创建基础项目结构
    await fs.ensureDir(path.join(targetPath, 'client'));
    await fs.ensureDir(path.join(targetPath, 'server'));
    await fs.ensureDir(path.join(targetPath, 'types'));

    // 创建基础 package.json
    const packageJson = {
      name: 'vibe-project',
      version: '1.0.0',
      description: 'A SaaS project created with Vibe CLI',
      scripts: {
        dev: 'echo "Development server not configured yet"',
        build: 'echo "Build script not configured yet"',
        start: 'echo "Start script not configured yet"'
      },
      dependencies: {},
      devDependencies: {}
    };

    await fs.writeJson(path.join(targetPath, 'package.json'), packageJson, { spaces: 2 });

    // 创建基础 README
    const readme = `# Vibe Project

这是一个使用 Vibe CLI 创建的 SaaS 项目。

## 开始使用

\`\`\`bash
npm install
npm run dev
\`\`\`

## 添加功能

\`\`\`bash
# 添加用户认证
vibe install auth --provider=clerk

# 添加支付系统
vibe install payments --provider=stripe

# 添加国际化
vibe install i18n --provider=next-intl
\`\`\`
`;

    await fs.writeFile(path.join(targetPath, 'README.md'), readme);
  }
} 