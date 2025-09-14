import { Command } from 'commander';
import chalk from 'chalk';
import { HealthChecker } from '../core/health-checker';

export const healthCommand = new Command('health')
  .description('check project health')
  .action(async () => {
    console.log(chalk.blue.bold('\n🏥 project health check\n'));
    
    const healthChecker = new HealthChecker();
    const results = await healthChecker.checkAll();
    
    results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
      const color = result.status === 'pass' ? 'green' : result.status === 'warn' ? 'yellow' : 'red';
      
      console.log(chalk[color](`${icon} ${result.name}: ${result.message}`));
      
      if (result.suggestions && result.suggestions.length > 0) {
        result.suggestions.forEach(suggestion => {
          console.log(chalk.gray(`   💡 ${suggestion}`));
        });
      }
    });
    
    const failedChecks = results.filter(r => r.status === 'fail');
    if (failedChecks.length > 0) {
      console.log(chalk.red.bold(`\n❌ found ${failedChecks.length} issues need to be fixed`));
      process.exit(1);
    } else {
      console.log(chalk.green.bold('\n✅ project health is good!'));
    }
  }); 