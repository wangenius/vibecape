import { Command } from 'commander';
import chalk from 'chalk';
import { UpdateManager } from '../core/update-manager';

export const updateCommand = new Command('update')
  .description('更新已安装的中间件')
  .option('--all', '更新所有中间件')
  .argument('[integration]', '要更新的集成名称')
  .action(async (integration: string, options: any) => {
    console.log(chalk.blue.bold('\n🔄 更新中间件\n'));
    
    const updateManager = new UpdateManager();
    
    if (options.all) {
      await updateManager.updateAll();
    } else if (integration) {
      await updateManager.updateIntegration(integration);
    } else {
      console.log(chalk.yellow('请指定要更新的集成或使用 --all 更新所有'));
    }
  }); 