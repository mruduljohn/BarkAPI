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
  .action(async (opts) => {
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
      console.log(formatCheckResult(result));

      if (result.totals.breaking > 0) {
        process.exit(1);
      }
    } catch (err: any) {
      spinner.fail(chalk.red(`Check failed: ${err.message}`));
      process.exit(1);
    }
  });
