import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from '../config';
import { runCheck } from '../runner';
import { formatCheckResult } from '../output';

export const watchCommand = new Command('watch')
  .description('Continuously monitor API endpoints for drift')
  .option('--config <path>', 'Path to .barkapi.yml')
  .option('--interval <seconds>', 'Check interval in seconds', '30')
  .action(async (opts) => {
    let config;
    try {
      config = loadConfig(opts.config);
    } catch (err: any) {
      console.error(chalk.red(err.message));
      process.exit(1);
    }

    const interval = parseInt(opts.interval, 10) * 1000;

    console.log(chalk.cyan(`Watching ${config.project} every ${opts.interval}s...`));
    console.log(chalk.gray('Press Ctrl+C to stop.\n'));

    const tick = async () => {
      const spinner = ora('Running check...').start();
      try {
        const result = await runCheck(config!);
        spinner.stop();
        const timestamp = new Date().toLocaleTimeString();
        console.log(chalk.gray(`[${timestamp}]`));
        console.log(formatCheckResult(result));
      } catch (err: any) {
        spinner.fail(chalk.red(`Check failed: ${err.message}`));
      }
    };

    await tick();
    setInterval(tick, interval);
  });
