import { Command } from 'commander';
import chalk from 'chalk';
import { UpdateManager } from '../core/update-manager';

export const updateCommand = new Command('update')
  .description('update installed middleware')
  .option('--all', 'update all middleware')
  .argument('[integration]', 'integration name to update')
  .action(async (integration: string, options: any) => {
    console.log(chalk.blue.bold('\n🔄 update middleware\n'));
    
    const updateManager = new UpdateManager();
    
    if (options.all) {
      await updateManager.updateAll();
    } else if (integration) {
      await updateManager.updateIntegration(integration);
    } else {
      console.log(chalk.yellow('please specify the integration to update or use --all to update all'));
    }
  }); 