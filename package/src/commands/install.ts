import chalk from "chalk";
import { Command } from "commander";
import inquirer from "inquirer";
import ora from "ora";
import { IntegrationManager } from "../core/integration-manager";

export const installCommand = new Command("install")
	.description("安装和集成中间件服务")
	.argument(
		"[integration]",
		"要安装的集成 (auth, payments, i18n, database, email, storage, analytics)",
	)
	.option("-p, --provider <provider>", "指定服务提供商")
	.option("--config <config>", "额外配置参数")
	.action(async (integration: string, options: any) => {
		try {
			console.log(chalk.blue.bold("\n🔧 Vibe CLI - 中间件集成工具\n"));

			const integrationManager = new IntegrationManager();

			// 如果没有指定集成类型，显示可用选项
			if (!integration) {
				const availableIntegrations =
					await integrationManager.getAvailableIntegrations();

				const answers = await inquirer.prompt([
					{
						type: "list",
						name: "integration",
						message: "选择要安装的集成:",
						choices: availableIntegrations.map((i) => ({
							name: `${i.name} - ${i.description}`,
							value: i.name,
						})),
					},
				]);
				integration = answers.integration;
			}

			// 获取该集成的可用提供商
			const providers = await integrationManager.getProviders(integration);

			let selectedProvider = options.provider;

			if (!selectedProvider && providers.length > 1) {
				const providerAnswers = await inquirer.prompt([
					{
						type: "list",
						name: "provider",
						message: `选择 ${integration} 服务提供商:`,
						choices: providers.map((p) => ({
							name: `${p.name} - ${p.description}`,
							value: p.name,
						})),
					},
				]);
				selectedProvider = providerAnswers.provider;
			} else if (providers.length === 1) {
				selectedProvider = providers[0].name;
			}

			// 获取提供商特定的配置选项
			const configOptions = await integrationManager.getConfigOptions(
				integration,
				selectedProvider,
			);

			let config: any = {};
			if (configOptions.length > 0) {
				config = await inquirer.prompt(configOptions);
			}

			// 安装集成
			const spinner = ora(
				`正在安装 ${integration} (${selectedProvider})...`,
			).start();

			await integrationManager.install({
				type: integration,
				provider: selectedProvider,
				config: { ...config, ...options.config },
			});

			spinner.succeed(`${integration} 集成安装成功！`);

			// 显示后续步骤
			console.log(chalk.green.bold("\n✅ 集成安装完成！\n"));

			const nextSteps = await integrationManager.getNextSteps(
				integration,
				selectedProvider,
			);
			if (nextSteps.length > 0) {
				console.log(chalk.cyan("下一步操作:"));
				nextSteps.forEach((step) => {
					console.log(chalk.white(`  ${step}`));
				});
			}
		} catch (error) {
			console.error(chalk.red("安装集成失败:"), error);
			process.exit(1);
		}
	});
