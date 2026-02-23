import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { spawn, exec } from 'child_process';
import path from 'path';
import { loadConfig } from '../config';
import { runCheck } from '../runner';
import { formatCheckResult } from '../output';

export const devCommand = new Command('dev')
  .description('Start dashboard + watch mode (full dev experience)')
  .option('--config <path>', 'Path to .barkapi.yml')
  .option('--interval <seconds>', 'Check interval in seconds', '30')
  .option('--port <port>', 'Dashboard port', '3100')
  .option('--no-open', 'Don\'t auto-open browser')
  .action(async (opts) => {
    let config;
    try {
      config = loadConfig(opts.config);
    } catch (err: any) {
      console.error(chalk.red(err.message));
      process.exit(1);
    }

    const port = parseInt(opts.port, 10);
    const interval = parseInt(opts.interval, 10) * 1000;
    const dbPath = path.resolve(process.cwd(), '.barkapi', 'barkapi.db');

    // Find the dashboard package directory
    const dashboardDir = findDashboardDir();
    if (!dashboardDir) {
      console.error(chalk.red('Could not find @barkapi/dashboard package. Make sure it is installed.'));
      process.exit(1);
    }

    console.log(chalk.cyan.bold('\n  🐕 BarkAPI Dev Mode\n'));
    console.log(chalk.gray('  Dashboard: ') + chalk.white(`http://localhost:${port}`));
    console.log(chalk.gray('  Watching:  ') + chalk.white(`${config.project} every ${opts.interval}s`));
    console.log(chalk.gray('  DB:        ') + chalk.white(dbPath));
    console.log('');

    // Start dashboard with shared DB path
    const dashboardEnv = {
      ...process.env,
      BARKAPI_DB_PATH: dbPath,
      PORT: String(port),
    };

    const dashboard = spawn('npx', ['next', 'dev', '-p', String(port)], {
      cwd: dashboardDir,
      env: dashboardEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    dashboard.stdout?.on('data', (data: Buffer) => {
      const line = data.toString().trim();
      if (line) {
        console.log(chalk.gray(`  [dashboard] ${line}`));
      }
    });

    dashboard.stderr?.on('data', (data: Buffer) => {
      const line = data.toString().trim();
      if (line && !line.includes('ExperimentalWarning')) {
        console.log(chalk.gray(`  [dashboard] ${line}`));
      }
    });

    dashboard.on('error', (err) => {
      console.error(chalk.red(`Dashboard failed to start: ${err.message}`));
    });

    // Auto-open browser after a delay
    if (opts.open !== false) {
      setTimeout(() => {
        const url = `http://localhost:${port}`;
        openBrowser(url);
      }, 3000);
    }

    // Run watch loop
    console.log(chalk.cyan(`  Starting watch mode...\n`));

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
    const watchTimer = setInterval(tick, interval);

    // Graceful shutdown
    const cleanup = () => {
      console.log(chalk.gray('\n  Shutting down...'));
      clearInterval(watchTimer);
      dashboard.kill();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  });

function findDashboardDir(): string | null {
  // Try common monorepo locations
  const candidates = [
    path.resolve(__dirname, '..', '..', '..', 'dashboard'),
    path.resolve(process.cwd(), 'packages', 'dashboard'),
    path.resolve(process.cwd(), 'node_modules', '@barkapi', 'dashboard'),
  ];

  for (const dir of candidates) {
    try {
      const pkgPath = path.join(dir, 'package.json');
      const pkg = require(pkgPath);
      if (pkg.name === '@barkapi/dashboard') {
        return dir;
      }
    } catch {
      // not found, try next
    }
  }

  return null;
}

function openBrowser(url: string): void {
  const cmd = process.platform === 'darwin'
    ? `open "${url}"`
    : process.platform === 'win32'
      ? `start "${url}"`
      : `xdg-open "${url}"`;

  exec(cmd, (err) => {
    if (err) {
      console.log(chalk.gray(`  Open ${url} in your browser`));
    }
  });
}
