import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from '../config';
import { runCheck } from '../runner';
import { formatCheckResult } from '../output';

export const checkCommand = new Command('check')
  .description('Check API endpoints for contract drift')
  .option('--config <path>', 'Path to .barkapi.yml')
  .option('--spec <path>', 'Override spec path')
  .option('--base-url <url>', 'Override base URL')
  .option('--json', 'Output as JSON')
  .option('--watch', 'Run continuously on an interval')
  .option('--interval <seconds>', 'Check interval when using --watch', '30')
  .action(async (opts) => {
    if (opts.watch) {
      return runWatchMode(opts);
    }

    const spinner = ora('Loading configuration...').start();

    let config;
    try {
      config = loadConfig(opts.config);
    } catch (err: any) {
      spinner.fail(chalk.red(err.message));
      process.exit(1);
    }

    if (opts.spec) config.spec = opts.spec;
    if (opts.baseUrl) config.base_url = opts.baseUrl;

    spinner.text = `Parsing ${config.spec}...`;

    try {
      spinner.text = 'Checking endpoints for drift...';
      const result = await runCheck(config);

      spinner.stop();

      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatCheckResult(result));
      }

      if (result.totals.breaking > 0) {
        process.exit(1);
      }
    } catch (err: any) {
      spinner.fail(chalk.red(`Check failed: ${err.message}`));
      process.exit(1);
    }
  });

async function runWatchMode(opts: any) {
  let config;
  try {
    config = loadConfig(opts.config);
  } catch (err: any) {
    console.error(chalk.red(err.message));
    process.exit(1);
  }

  if (opts.spec) config.spec = opts.spec;
  if (opts.baseUrl) config.base_url = opts.baseUrl;

  const interval = parseInt(opts.interval, 10) * 1000;

  console.log(chalk.cyan(`Watching ${config.project} every ${opts.interval}s...`));
  console.log(chalk.gray('Press Ctrl+C to stop.\n'));

  const tick = async () => {
    const spinner = ora('Running check...').start();
    try {
      const result = await runCheck(config!);
      spinner.stop();
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        const timestamp = new Date().toLocaleTimeString();
        console.log(chalk.gray(`[${timestamp}]`));
        console.log(formatCheckResult(result));
      }
    } catch (err: any) {
      spinner.fail(chalk.red(`Check failed: ${err.message}`));
    }
  };

  await tick();
  setInterval(tick, interval);
}
