# Vibe CLI 开发指南

## 🏗️ 项目架构

### 目录结构

```
vibe/
├── src/                     # 源代码
│   ├── cli.ts              # CLI 入口文件
│   ├── commands/           # 命令处理器
│   │   ├── create.ts       # vibe create
│   │   ├── install.ts      # vibe install
│   │   ├── config.ts       # vibe config
│   │   ├── health.ts       # vibe health
│   │   ├── templates.ts    # vibe templates
│   │   ├── update.ts       # vibe update
│   │   └── revise.ts       # vibe revise
│   ├── core/               # 核心模块
│   │   ├── project-creator.ts      # 项目创建器
│   │   ├── template-manager.ts     # 模板管理器
│   │   ├── integration-manager.ts  # 集成管理器
│   │   ├── config-manager.ts       # 配置管理器
│   │   ├── health-checker.ts       # 健康检查器
│   │   ├── update-manager.ts       # 更新管理器
│   │   └── project-reviser.ts      # 项目修正器
│   └── types/              # 类型定义
│       └── index.ts
├── templates/              # 项目模板
│   ├── basic-saas/         # 基础 SaaS 模板
│   ├── ai-saas/           # AI SaaS 模板
│   └── e-commerce/        # 电商模板
├── dist/                  # 编译输出
├── test/                  # 测试文件
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
└── README.md
```

### 技术栈

- **语言**: TypeScript
- **CLI框架**: Commander.js
- **交互**: Inquirer.js
- **样式**: Chalk
- **加载动画**: Ora
- **文件操作**: fs-extra
- **模板引擎**: Handlebars
- **测试**: Jest
- **代码质量**: ESLint + Prettier

## 🛠️ 开发环境设置

### 1. 克隆项目

```bash
git clone https://github.com/your-username/vibe.git
cd vibe
```

### 2. 安装依赖

```bash
npm install
```

### 3. 开发模式

```bash
# 监听文件变化并自动编译
npm run dev

# 或者手动编译
npm run build
```

### 4. 测试 CLI

```bash
# 使用本地构建版本
node dist/cli.js --help

# 或者使用 ts-node 直接运行
npx ts-node src/cli.ts --help
```

## 📝 开发规范

### 代码风格

使用 ESLint 和 Prettier 保持代码一致性：

```bash
# 检查代码风格
npm run lint

# 自动格式化
npm run format
```

### 提交规范

使用语义化提交信息：

```bash
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 重构代码
test: 添加测试
chore: 构建/工具相关
```

### TypeScript 规范

- 使用严格模式
- 明确类型定义
- 避免使用 `any`
- 使用接口定义数据结构

## 🔧 核心模块开发

### 1. 命令处理器 (Commands)

每个命令都是一个独立的模块，位于 `src/commands/` 目录：

```typescript
// src/commands/example.ts
import { Command } from 'commander';
import chalk from 'chalk';

export const exampleCommand = new Command('example')
  .description('示例命令')
  .action(async () => {
    console.log(chalk.blue('执行示例命令'));
  });
```

### 2. 核心服务 (Core)

核心业务逻辑位于 `src/core/` 目录：

```typescript
// src/core/example-service.ts
export class ExampleService {
  async doSomething(): Promise<void> {
    // 业务逻辑实现
  }
}
```

### 3. 类型定义 (Types)

所有类型定义集中在 `src/types/index.ts`：

```typescript
export interface ExampleConfig {
  name: string;
  version: string;
}
```

## 🧪 测试

### 单元测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

### 集成测试

```bash
# 测试完整的 CLI 功能
node test-create.js
```

### 手动测试

```bash
# 构建项目
npm run build

# 测试各种命令
node dist/cli.js health
node dist/cli.js templates list
node dist/cli.js create test-project --template=basic-saas
```

## 📦 模板开发

### 创建新模板

1. 在 `templates/` 目录下创建新的模板文件夹
2. 添加模板文件和配置
3. 在 `TemplateManager` 中注册新模板

```typescript
// src/core/template-manager.ts
const templates: Template[] = [
  // ... 现有模板
  {
    name: 'new-template',
    displayName: 'New Template',
    description: '新模板描述',
    path: path.join(this.templatesDir, 'new-template')
  }
];
```

### 模板变量

模板支持 Handlebars 变量替换：

```json
{
  "name": "{{projectName}}",
  "version": "1.0.0"
}
```

## 🔌 集成开发

### 添加新集成

1. 在 `IntegrationManager` 中添加集成定义
2. 实现安装逻辑
3. 添加配置选项
4. 提供使用文档

```typescript
// src/core/integration-manager.ts
{
  name: 'new-integration',
  description: '新集成描述',
  providers: [
    {
      name: 'provider-name',
      description: '提供商描述',
      configOptions: [
        {
          type: 'confirm',
          name: 'enable',
          message: '是否启用此功能?',
          default: true
        }
      ]
    }
  ]
}
```

## 🚀 发布流程

### 1. 版本管理

```bash
# 更新版本号
npm version patch  # 补丁版本
npm version minor  # 次要版本
npm version major  # 主要版本
```

### 2. 构建和测试

```bash
# 完整测试
npm run lint
npm run build
npm test

# 手动测试关键功能
node dist/cli.js health
node dist/cli.js create test-project
```

### 3. 发布到 npm

```bash
# 发布到 npm
npm publish

# 或者发布 beta 版本
npm publish --tag beta
```

## 🐛 调试技巧

### 1. 开发调试

```bash
# 使用 Node.js 调试器
node --inspect-brk dist/cli.js create test-project

# 或者使用 VS Code 调试配置
```

### 2. 日志调试

```typescript
// 添加调试日志
console.log(chalk.gray(`[DEBUG] ${message}`));
```

### 3. 错误处理

```typescript
try {
  // 可能出错的代码
} catch (error) {
  console.error(chalk.red('错误:'), error.message);
  process.exit(1);
}
```

## 📚 参考资源

### 依赖文档

- [Commander.js](https://github.com/tj/commander.js) - CLI 框架
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) - 交互式命令行
- [Chalk](https://github.com/chalk/chalk) - 终端颜色
- [Ora](https://github.com/sindresorhus/ora) - 加载动画
- [fs-extra](https://github.com/jprichardson/node-fs-extra) - 文件系统操作

### 最佳实践

- [Node.js CLI 最佳实践](https://github.com/lirantal/nodejs-cli-apps-best-practices)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Commander.js 指南](https://github.com/tj/commander.js/blob/master/Readme.md)

## 🤝 贡献指南

### 提交 PR

1. Fork 项目
2. 创建功能分支
3. 完成开发和测试
4. 提交 PR

### 代码审查

- 确保代码通过所有测试
- 检查代码风格
- 验证功能完整性
- 更新相关文档

### 问题报告

使用 GitHub Issues 报告问题，包含：
- 环境信息
- 重现步骤
- 期望行为
- 实际行为

---

Happy coding! 🎉 