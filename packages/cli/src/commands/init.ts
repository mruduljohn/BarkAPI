import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeConfig, detectSpecFile, detectProjectName, findConfigFile } from '../config';
import type { BarkApiConfig } from '../config';

export const initCommand = new Command('init')
  .description('Initialize BarkAPI in the current project')
  .option('--spec <path>', 'Path to OpenAPI spec file')
  .option('--base-url <url>', 'Base URL for API')
  .option('--name <name>', 'Project name')
  .action(async (opts) => {
    const spinner = ora('Detecting project configuration...').start();

    // Check if already initialized
    const existingConfig = findConfigFile();
    if (existingConfig) {
      spinner.warn(chalk.yellow('.barkapi.yml already exists'));
      return;
    }

    // Detect spec file
    const specFile = opts.spec || detectSpecFile();
    if (!specFile) {
      spinner.fail(chalk.red('No OpenAPI spec file found. Use --spec to specify one.'));
      process.exit(1);
    }
    spinner.text = `Found spec: ${specFile}`;

    // Detect project name
    const projectName = opts.name || detectProjectName();

    // Base URL
    const baseUrl = opts.baseUrl || 'http://localhost:3000';

    const config: BarkApiConfig = {
      project: projectName,
      spec: specFile,
      base_url: baseUrl,
    };

    const configPath = writeConfig(config);
    spinner.succeed(chalk.green(`Created ${configPath}`));

    console.log('');
    console.log(chalk.gray('  project: ') + chalk.white(config.project));
    console.log(chalk.gray('  spec:    ') + chalk.white(config.spec));
    console.log(chalk.gray('  url:     ') + chalk.white(config.base_url));
    console.log('');
    console.log(chalk.gray('Run ') + chalk.cyan('barkapi check') + chalk.gray(' to detect drift.'));
  });
