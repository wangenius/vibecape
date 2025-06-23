import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectCreator } from '../core/project-creator';
import { TemplateManager } from '../core/template-manager';

export const createCommand = new Command('create')
  .description('创建新的 SaaS 项目')
  .argument('[project-name]', '项目名称')
  .option('-t, --template <template>', '指定项目模板')
  .option('--typescript', '启用 TypeScript')
  .option('--tailwind', '启用 Tailwind CSS')
  .option('--eslint', '启用 ESLint')
  .action(async (projectName: string, options: any) => {
    try {
      console.log(chalk.blue.bold('\n🚀 欢迎使用 Vibe CLI - SaaS 应用搭建神器\n'));

      // 如果没有提供项目名称，则交互式询问
      if (!projectName) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'projectName',
            message: '项目名称:',
            validate: (input: string) => {
              if (!input.trim()) {
                return '项目名称不能为空';
              }
              if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
                return '项目名称只能包含字母、数字、横线和下划线';
              }
              return true;
            }
          }
        ]);
        projectName = answers.projectName;
      }

      // 获取可用模板
      const templateManager = new TemplateManager();
      const templates = await templateManager.getAvailableTemplates();

      // 构建需要询问的问题
      const questions: any[] = [];

      // 只有在没有指定模板时才询问
      if (!options.template) {
        questions.push({
          type: 'list',
          name: 'template',
          message: '选择项目模板:',
          choices: templates.map(t => ({ name: t.displayName, value: t.name })),
          default: 'ai-saas'
        });
      }

      // 包管理器选择
      questions.push({
        type: 'list',
        name: 'packageManager',
        message: '选择包管理器:',
        choices: ['npm', 'yarn', 'pnpm'],
        default: 'npm'
      });

      // 只有在没有指定选项时才询问
      if (options.typescript === undefined) {
        questions.push({
          type: 'confirm',
          name: 'typescript',
          message: '启用 TypeScript:',
          default: true
        });
      }

      if (options.tailwind === undefined) {
        questions.push({
          type: 'confirm',
          name: 'tailwind',
          message: '启用 Tailwind CSS:',
          default: true
        });
      }

      if (options.eslint === undefined) {
        questions.push({
          type: 'confirm',
          name: 'eslint',
          message: '启用 ESLint:',
          default: true
        });
      }

      // 执行交互式询问
      const answers = questions.length > 0 ? await inquirer.prompt(questions) : {};

      // 合并选项和答案
      const config = {
        template: options.template || answers.template || 'ai-saas',
        packageManager: answers.packageManager || 'npm',
        typescript: options.typescript !== undefined ? options.typescript : (answers.typescript !== undefined ? answers.typescript : true),
        tailwind: options.tailwind !== undefined ? options.tailwind : (answers.tailwind !== undefined ? answers.tailwind : true),
        eslint: options.eslint !== undefined ? options.eslint : (answers.eslint !== undefined ? answers.eslint : true)
      };

      // 创建项目
      const spinner = ora('正在创建项目...').start();
      
      const projectCreator = new ProjectCreator();
      await projectCreator.create({
        name: projectName,
        template: config.template,
        packageManager: config.packageManager,
        typescript: config.typescript,
        tailwind: config.tailwind,
        eslint: config.eslint,
        path: path.resolve(process.cwd(), projectName)
      });

      spinner.succeed('项目创建成功！');

      // 显示下一步操作
      console.log(chalk.green.bold('\n✅ 项目创建完成！\n'));
      console.log(chalk.cyan('下一步操作:'));
      console.log(chalk.white(`  cd ${projectName}`));
      console.log(chalk.white(`  ${config.packageManager} install`));
      console.log(chalk.white(`  ${config.packageManager} run dev`));
      console.log(chalk.cyan('\n添加功能:'));
      console.log(chalk.white('  vibe install auth --provider=clerk'));
      console.log(chalk.white('  vibe install payments --provider=stripe'));
      console.log(chalk.white('  vibe install i18n --provider=next-intl'));

    } catch (error) {
      console.error(chalk.red('创建项目失败:'), error);
      process.exit(1);
    }
  }); 