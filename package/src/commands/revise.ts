import { Command } from 'commander';
import chalk from 'chalk';
import { ProjectReviser } from '../core/project-reviser';

export const reviseCommand = new Command('revise')
  .description('修正和优化项目结构')
  .action(async () => {
    console.log(chalk.blue.bold('\n🔧 项目修正工具\n'));
    
    const reviser = new ProjectReviser();
    await reviser.reviseProject();
    
    console.log(chalk.green.bold('\n✅ 项目修正完成！'));
  }); 