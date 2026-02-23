import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { loadConfig } from '../config';
import { runCheck } from '../runner';
import { formatCheckResult } from '../output';

export const reportCommand = new Command('report')
  .description('Run check and optionally push results to dashboard')
  .option('--config <path>', 'Path to .barkapi.yml')
  .option('--push', 'Push results to dashboard')
  .action(async (opts) => {
    const spinner = ora('Loading configuration...').start();

    let config;
    try {
      config = loadConfig(opts.config);
    } catch (err: any) {
      spinner.fail(chalk.red(err.message));
      process.exit(1);
    }

    spinner.text = 'Running check...';

    try {
      const result = await runCheck(config);
      spinner.stop();
      console.log(formatCheckResult(result));

      if (opts.push) {
        console.log(chalk.yellow('\n  ⚠ --push is deprecated. The dashboard now reads from the shared database automatically.'));
        console.log(chalk.yellow('    Just run `barkapi dev` for the full experience.\n'));
        const dashboardUrl = config.dashboard_url || 'http://localhost:3100';
        const pushSpinner = ora(`Pushing results to ${dashboardUrl}...`).start();

        try {
          await pushToDashboard(dashboardUrl, result);
          pushSpinner.succeed(chalk.green('Results pushed to dashboard'));
        } catch (err: any) {
          pushSpinner.fail(chalk.red(`Push failed: ${err.message}`));
        }
      }

      if (result.totals.breaking > 0) {
        process.exit(1);
      }
    } catch (err: any) {
      spinner.fail(chalk.red(`Report failed: ${err.message}`));
      process.exit(1);
    }
  });

async function pushToDashboard(baseUrl: string, result: any): Promise<void> {
  const url = new URL('/api/check-runs', baseUrl);
  const body = JSON.stringify(result);

  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
