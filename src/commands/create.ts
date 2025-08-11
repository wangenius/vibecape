import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ProjectCreator } from '../core/project-creator';
import { TemplateManager } from '../core/template-manager';
import { templates } from '../const';

export const createCommand = new Command('create')
  .description('创建新的 SaaS 项目')
  .argument('[project-name]', '项目名称')
  .option('-t, --template <template>', '指定项目模板')
  .option('--typescript', '启用 TypeScript')
  .option('--tailwind', '启用 Tailwind CSS')
  .option('--eslint', '启用 ESLint')
  .action(async (projectName: string, options: any) => {
    try {
      console.log(
        chalk.blue.bold('\n🚀 欢迎使用 Vibe CLI - SaaS 应用搭建神器\n')
      );

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
            },
          },
        ]);
        projectName = answers.projectName;
      }

      // 选择模板
      const availableTemplateNames = Object.keys(templates);
      if (availableTemplateNames.length === 0) {
        throw new Error('未配置任何模板');
      }
      const template = options.template && availableTemplateNames.includes(options.template)
        ? options.template
        : availableTemplateNames[0];
      // 创建项目
      const spinner = ora('正在创建项目...').start();

      const projectCreator = new ProjectCreator(projectName);
      await projectCreator.create(template);

      spinner.succeed('项目创建成功！');

      // 显示下一步操作
      console.log(chalk.green.bold('\n✅ 项目创建完成！\n'));
      console.log(chalk.cyan('下一步操作:'));
      console.log(chalk.white(`  cd ${projectName}`));
      console.log(chalk.cyan('\n添加功能:'));
      console.log(chalk.white('  vibe install auth --provider=clerk'));
      console.log(chalk.white('  vibe install payments --provider=stripe'));
      console.log(chalk.white('  vibe install i18n --provider=next-intl'));
    } catch (error) {
      console.error(chalk.red('创建项目失败:'), error);
      process.exit(1);
    }
  });
