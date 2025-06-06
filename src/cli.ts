#!/usr/bin/env node

import { program } from 'commander';
import { createGenerateCommand } from './cli/commands/generate';
import { createInitCommand } from './cli/commands/init';
import { createValidateCommand } from './cli/commands/validate';
import { FileUtils } from './utils/file-utils';
import path from 'path';

async function getVersion(): Promise<string> {
  try {
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
    const packageJson = await FileUtils.readJsonFile<{ version: string }>(packageJsonPath);
    return packageJson.version;
  } catch (error) {
    try {
      const fallbackPath = path.join(__dirname, '..', 'package.json');
      const packageJson = await FileUtils.readJsonFile<{ version: string }>(fallbackPath);
      return packageJson.version;
    } catch {
      return '0.0.0';
    }
  }
}

async function main() {
  const version = await getVersion();
  
  program
    .name('assetmill')
    .description('CLI tool for automated image asset generation and optimization')
    .version(version);

  program.addCommand(createGenerateCommand());
  program.addCommand(createInitCommand());
  program.addCommand(createValidateCommand());

  program.parse();
}

main().catch(console.error);
