#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
// 通过 package.json 动态读取版本号，避免手动同步
// 注意：tsconfig 已启用 resolveJsonModule
import pkg from "../package.json";
import { configCommand } from "./commands/config";
import { createCommand } from "./commands/create";
import { healthCommand } from "./commands/health";
import { templatesCommand } from "./commands/templates";
import { upgradeCommand } from "./commands/upgrade";

const program = new Command();

// 设置基本信息
program
  .name("vibe")
  .description("vibecape - develop and ship your idea in 10 minutes")
  .version(pkg.version, "-v, --version", "显示版本号");

// 添加欢迎信息
program.addHelpText(
  "before",
  chalk.blue.bold(`
vibecape : welcome to vibecape world!
`)
);

// 注册命令
program
  .addCommand(createCommand)
  .addCommand(configCommand)
  .addCommand(healthCommand)
  .addCommand(templatesCommand)
  .addCommand(upgradeCommand);

// 解析命令行参数
program.parse();
