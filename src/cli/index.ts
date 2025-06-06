#!/usr/bin/env node

import { Command } from 'commander';
import { createGenerateCommand } from './commands/generate';
import { createInitCommand } from './commands/init';
import { createValidateCommand } from './commands/validate';
import { Logger } from '../utils/logger';

const program = new Command();

program
  .name('assetmill')
  .description('A powerful command-line tool for automated image asset processing and optimization')
  .version('0.2.1');

program.addCommand(createInitCommand());
program.addCommand(createGenerateCommand());
program.addCommand(createValidateCommand());

program
  .command('help')
  .description('Display help information')
  .action(() => {
    program.help();
  });

if (process.argv.length === 2) {
  program.help();
}

program.parse();

process.on('unhandledRejection', (reason) => {
  Logger.error('Unhandled Rejection at:', reason as Error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception:', error);
  process.exit(1);
});
