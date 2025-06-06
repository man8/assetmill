#!/usr/bin/env node

import { program } from 'commander';
import { createGenerateCommand } from './cli/commands/generate';
import { createInitCommand } from './cli/commands/init';
import { createValidateCommand } from './cli/commands/validate';

program
  .name('assetmill')
  .description('CLI tool for automated image asset generation and optimization')
  .version('0.0.1');

program.addCommand(createGenerateCommand());
program.addCommand(createInitCommand());
program.addCommand(createValidateCommand());

program.parse();
