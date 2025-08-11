import { Command } from 'commander';
import chalk from 'chalk';
import { templates } from '../const';

export const templatesCommand = new Command('templates')
  .description('管理项目模板')
  .addCommand(
    new Command('list').description('显示可用模板').action(async () => {
      console.log(chalk.cyan.bold('\n📋 可用模板:\n'));
      Object.keys(templates).forEach((template) => {
        console.log(
          chalk.white(`${template} - ${templates[template].description}`)
        );
      });
    })
  );
