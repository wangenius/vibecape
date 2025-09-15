import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { execSync } from "child_process";
import axios from "axios";
import semver from "semver";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pkg from "../../package.json";

export const upgradeCommand = new Command("upgrade")
  .description("升级 vibe CLI 到最新版本")
  .option("--check", "仅检查是否有新版本可用")
  .action(async () => {
    console.log(chalk.blue.bold("\n🔄 检查 Vibecape CLI 更新\n"));

    const spinner = ora("检查最新版本...").start();

    try {
      // 获取 npm 上的最新版本
      const response = await axios.get("https://registry.npmjs.org/vibecape");
      const latestVersion = response.data["dist-tags"].latest;
      const currentVersion = pkg.version;

      spinner.stop();

      console.log(chalk.gray(`当前版本: ${currentVersion}`));
      console.log(chalk.gray(`最新版本: ${latestVersion}`));

      if (semver.gt(latestVersion, currentVersion)) {
        console.log(chalk.green.bold("\n✨ 发现新版本！\n"));

        const upgradeSpinner = ora("正在升级到最新版本...").start();

        try {
          // 全局安装最新版本
          execSync("npm install -g vibecape@latest", { stdio: "pipe" });
          upgradeSpinner.succeed(
            chalk.green.bold(`🎉 成功升级到版本 ${latestVersion}！`)
          );
          console.log(
            chalk.blue("\n重新启动终端或运行 `vibe --version` 来确认版本更新")
          );
        } catch (error) {
          upgradeSpinner.fail("升级失败");
          console.error(chalk.red("升级过程中出现错误:"));
          console.error(
            chalk.red(error instanceof Error ? error.message : String(error))
          );
          console.log(
            chalk.yellow("\n您可以尝试手动运行: npm install -g vibecape@latest")
          );
        }
      } else if (semver.eq(latestVersion, currentVersion)) {
        console.log(chalk.green.bold("\n✅ 您已经在使用最新版本！"));
      } else {
        console.log(
          chalk.yellow.bold("\n⚠️ 您正在使用一个比最新发布版本更新的版本")
        );
      }
    } catch (error) {
      spinner.fail("检查版本失败");
      console.error(chalk.red("无法连接到 npm registry:"));
      console.error(
        chalk.red(error instanceof Error ? error.message : String(error))
      );
      console.log(chalk.yellow("\n请检查网络连接或稍后重试"));
    }
  });
