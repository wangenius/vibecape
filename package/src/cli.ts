#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
// 通过 package.json 动态读取版本号，避免手动同步
// 注意：tsconfig 已启用 resolveJsonModule
import pkg from "../package.json";
import { configCommand } from "./commands/config";
import { createCommand } from "./commands/create";
import { healthCommand } from "./commands/health";
import { installCommand } from "./commands/install";
import { reviseCommand } from "./commands/revise";
import { templatesCommand } from "./commands/templates";
import { updateCommand } from "./commands/update";
import { upgradeCommand } from "./commands/upgrade";

const program = new Command();

// 设置基本信息
program
	.name("vibe")
	.description("vibecape - develop and ship your idea in 10 minutes")
	// 支持 -v (小写) 与 --version，便于用户输入
	.version(pkg.version, "-v, --version", "显示版本号");

// 添加欢迎信息
program.addHelpText(
	"before",
	chalk.blue.bold(`
🚀 Vibecape : make your idea come true in 10 minutes
`),
);

// 注册命令
program.addCommand(createCommand);
program.addCommand(installCommand);
program.addCommand(configCommand);
program.addCommand(healthCommand);
program.addCommand(templatesCommand);
program.addCommand(updateCommand);
program.addCommand(reviseCommand);
program.addCommand(upgradeCommand);

// 解析命令行参数
program.parse();
