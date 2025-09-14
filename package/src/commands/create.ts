import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ProjectCreator } from '../core/project-creator';
import { templates } from '../const';

export const createCommand = new Command('create')
  .description('create a new project')
  .argument('[project-name]', 'project name')
  .action(async (projectName: string, options: any) => {
    try {
      console.log(
        chalk.blue.bold('\n🚀 Welcome to Vibe CLI - SaaS application builder\n')
      );

      // 如果没有提供项目名称，则交互式询问
      if (!projectName) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'projectName',
            message: 'project name:',
            validate: (input: string) => {
              if (!input.trim()) {
                return 'project name cannot be empty';
              }
              if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
                return 'project name can only contain letters, numbers, hyphens, and underscores';
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
        throw new Error('no template configured');
      }
      const template =
        options.template && availableTemplateNames.includes(options.template)
          ? options.template
          : availableTemplateNames[0];
      // 创建项目
      const spinner = ora('creating project...').start();

      const projectCreator = new ProjectCreator(projectName);
      await projectCreator.create(template);

      spinner.succeed('project created successfully!');

      // 显示下一步操作
      console.log(chalk.green.bold('\n✅ project created successfully!\n'));
      console.log(chalk.cyan('next step:'));
      console.log(chalk.white(`  cd ${projectName}`));
      console.log(chalk.cyan('\ninstall env:'));
      console.log(chalk.white('  vibe install'));
    } catch (error) {
      console.error(chalk.red('create project failed:'), error);
      process.exit(1);
    }
  });
