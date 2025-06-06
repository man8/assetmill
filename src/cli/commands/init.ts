import { Command } from 'commander';
import path from 'path';
import { ConfigLoader } from '../../config/loader';
import { FileUtils } from '../../utils/file-utils';
import { Logger } from '../../utils/logger';

export function createInitCommand(): Command {
  const command = new Command('init');

  command
    .description('Initialise a new asset pipeline configuration')
    .option('-o, --output <path>', 'Output path for configuration file', 'config.yml')
    .option('-f, --force', 'Overwrite existing configuration file', false)
    .action(async (options) => {
      try {
        const configPath = path.resolve(options.output);

        if (!options.force && await FileUtils.fileExists(configPath)) {
          Logger.error(`Configuration file already exists: ${configPath}`);
          Logger.info('Use --force to overwrite the existing file');
          process.exit(1);
        }

        Logger.info('Generating configuration template...');
        await ConfigLoader.generateTemplate(configPath);

        Logger.success(`Configuration file created: ${configPath}`);
        Logger.info('');
        Logger.info('Next steps:');
        Logger.info('1. Place your source image file(s) in the current directory');
        Logger.info('2. Edit the configuration file to match your requirements');
        Logger.info('3. Run "assetmill generate" to create your assets');
        Logger.info('');
        Logger.info('Example source files:');
        Logger.info('  - logo.svg (recommended for best quality)');
        Logger.info('  - logo.png (minimum 512x512 pixels)');

      } catch (error) {
        Logger.error('Failed to initialise configuration', error as Error);
        process.exit(1);
      }
    });

  return command;
}
