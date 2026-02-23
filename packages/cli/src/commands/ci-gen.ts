import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { loadConfig } from '../config';
import { getGitHubActionsWorkflow } from '../templates/github-actions';

export const ciGenCommand = new Command('ci-gen')
  .description('Generate a GitHub Actions workflow for contract checking')
  .option('--config <path>', 'Path to .barkapi.yml')
  .option('--base-url-var <var>', 'GitHub Actions variable for base URL', 'vars.STAGING_URL')
  .option('--output <path>', 'Output path', '.github/workflows/barkapi.yml')
  .action(async (opts) => {
    let config;
    try {
      config = loadConfig(opts.config);
    } catch (err: any) {
      console.error(chalk.red(err.message));
      process.exit(1);
    }

    const workflow = getGitHubActionsWorkflow(config.spec, opts.baseUrlVar);
    const outputPath = path.resolve(process.cwd(), opts.output);
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, workflow, 'utf-8');
    console.log(chalk.green(`CI workflow written to ${opts.output}`));
    console.log(chalk.gray(`\nMake sure to set ${opts.baseUrlVar} in your GitHub repository settings.`));
  });
