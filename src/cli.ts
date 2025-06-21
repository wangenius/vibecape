#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create';
import { installCommand } from './commands/install';
import { configCommand } from './commands/config';
import { healthCommand } from './commands/health';
import { templatesCommand } from './commands/templates';
import { updateCommand } from './commands/update';
import { reviseCommand } from './commands/revise';

const program = new Command();

// 设置基本信息
program
  .name('vibe')
  .description('SaaS 应用搭建神器 - 让开发者用一行命令就能快速搭建出完整的在线服务系统')
  .version('1.0.0');

// 添加欢迎信息
program.addHelpText('before', chalk.blue.bold(`
🚀 Vibe CLI - SaaS 应用搭建神器
让每个有想法的人都能在半小时内搭建出自己的在线服务产品
`));

// 注册命令
program.addCommand(createCommand);
program.addCommand(installCommand);
program.addCommand(configCommand);
program.addCommand(healthCommand);
program.addCommand(templatesCommand);
program.addCommand(updateCommand);
program.addCommand(reviseCommand);

// 解析命令行参数
program.parse(); 