import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../core/ConfigManager';

export const configCommand = new Command('config')
  .description('管理项目配置')
  .addCommand(
    new Command('list')
      .description('显示当前配置')
      .action(async () => {
        const configManager = new ConfigManager();
        const config = await configManager.getConfig();
        console.log(chalk.cyan('当前配置:'));
        console.log(JSON.stringify(config, null, 2));
      })
  )
  .addCommand(
    new Command('set')
      .description('设置配置项')
      .requiredOption('-k, --key <key>', '配置键')
      .requiredOption('-v, --value <value>', '配置值')
      .action(async (options) => {
        const configManager = new ConfigManager();
        await configManager.setConfig(options.key, options.value);
        console.log(chalk.green(`配置已更新: ${options.key} = ${options.value}`));
      })
  )
  .addCommand(
    new Command('get')
      .description('获取配置项')
      .argument('<key>', '配置键')
      .action(async (key) => {
        const configManager = new ConfigManager();
        const value = await configManager.getConfigValue(key);
        console.log(chalk.cyan(`${key}: ${value}`));
      })
  ); 