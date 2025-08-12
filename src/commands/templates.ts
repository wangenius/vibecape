import { Command } from 'commander';
import chalk from 'chalk';
import { templates } from '../const';

export const templatesCommand = new Command('templates')
  .description('manage project templates')
  .addCommand(
    new Command('list').description('show available templates').action(async () => {
      console.log(chalk.cyan.bold('\n📋 available templates:\n'));
      Object.keys(templates).forEach((template) => {
        console.log(
          chalk.white(`${template} - ${templates[template].description}`)
        );
      });
    })
  );
