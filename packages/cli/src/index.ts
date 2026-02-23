#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { checkCommand } from './commands/check';
import { watchCommand } from './commands/watch';
import { reportCommand } from './commands/report';

const program = new Command();

program
  .name('barkapi')
  .description('API Contract Drift Detector — Your API\'s watchdog')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(checkCommand);
program.addCommand(watchCommand);
program.addCommand(reportCommand);

program.parse();
