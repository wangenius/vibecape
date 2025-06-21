import { Command } from 'commander';
import chalk from 'chalk';
import { TemplateManager } from '../core/template-manager';

export const templatesCommand = new Command('templates')
  .description('管理项目模板')
  .addCommand(
    new Command('list')
      .description('显示可用模板')
      .action(async () => {
        const templateManager = new TemplateManager();
        const templates = await templateManager.getAvailableTemplates();
        
        console.log(chalk.cyan.bold('\n📋 可用模板:\n'));
        templates.forEach(template => {
          console.log(chalk.white(`${template.name} - ${template.description}`));
        });
      })
  ); 