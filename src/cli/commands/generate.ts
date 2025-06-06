import { Command } from 'commander';
import { ConfigLoader } from '../../config/loader';
import { AssetPipeline } from '../../pipeline/asset-pipeline';
import { Logger, LogLevel } from '../../utils/logger';
import * as path from 'path';
import * as fs from 'fs/promises';
import { CLIOptions } from '../../types';

export function createGenerateCommand(): Command {
  const command = new Command('generate');

  command
    .description('Generate image assets from source images')
    .option('-c, --config <path>', 'Path to configuration file', 'config.yml')
    .option('-o, --output <path>', 'Output directory (overrides config)')
    .option('-d, --dry-run', 'Preview operations without generating files', false)
    .option('-v, --verbose', 'Enable verbose logging', false)
    .option('-f, --force', 'Overwrite existing files', false)
    .option('-q, --quality <number>', 'Override quality setting (1-100)', parseInt)
    .option('--format <formats...>', 'Override output formats (png,jpeg,webp,avif)')
    .action(async (options: CLIOptions) => {
      try {
        if (options.verbose) {
          Logger.setLevel(LogLevel.DEBUG);
        }

        Logger.info('Loading configuration...');
        const configPath = options.config || ConfigLoader.findConfigFile() || 'config.yml';

        if (!configPath) {
          Logger.error('No configuration file found. Run "assetmill init" to create one.');
          process.exit(1);
        }

        const config = await ConfigLoader.load(configPath);

        Logger.info('Validating configuration...');
        const { ValidationUtils } = await import('../../utils/validation');
        
        const configErrors = ValidationUtils.validateConfigPaths(config);
        if (configErrors.length > 0) {
          Logger.error('Configuration validation failed:');
          configErrors.forEach(error => Logger.error(`  ${error}`));
          process.exit(1);
        }

        const outputPermissionErrors = await ValidationUtils.validateOutputPermissions(config);
        if (outputPermissionErrors.length > 0) {
          Logger.error('Output directory validation failed:');
          outputPermissionErrors.forEach(error => Logger.error(`  ${error}`));
          process.exit(1);
        }

        if (options.output) {
          config.output.directory = options.output;
        }

        if (options.quality) {
          Object.keys(config.processing.quality).forEach(format => {
            config.processing.quality[format as keyof typeof config.processing.quality] = options.quality!;
          });
        }

        if (options.format) {
          config.output.formats = options.format;
        }

        const pipeline = new AssetPipeline(config, options.dryRun);

        Logger.info('Starting asset generation...');
        const result = await pipeline.execute();

        if (!result.success) {
          Logger.error('Pipeline execution failed:');
          result.errors.forEach(error => {
            Logger.error(`  ${error.message}`);
          });
          process.exit(1);
        }

        const { assets, metrics } = result;
        Logger.info('');
        Logger.success('Asset generation completed successfully!');
        Logger.info(`Generated ${assets.length} assets in ${metrics.processingTime}ms`);

        if (options.verbose) {
          Logger.info('');
          Logger.info('Generated assets:');
          assets.forEach(asset => {
            const displayPath = path.relative(process.cwd(), asset.path);
            Logger.info(`  - ${displayPath} (${asset.width}x${asset.height})`);
          });
        }

      } catch (error) {
        Logger.error('Command execution failed', error as Error);
        process.exit(1);
      }
    });

  return command;
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
