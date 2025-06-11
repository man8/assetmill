import { Command } from 'commander';
import { ConfigLoader } from '../../config/loader';
import { AssetPipeline } from '../../pipeline/asset-pipeline';
import { Logger, LogLevel } from '../../utils/logger';
import * as path from 'path';
import { CLIOptions, OverwriteMode } from '../../types';
import { ConfigurationNotFoundError, ConfigurationValidationError, YamlParsingError } from '../../utils/errors';

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
    .option('--format <formats...>', 'Override output formats (png,jpeg,webp,avif,svg)')
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

        const overwriteMode: OverwriteMode = options.force ? 'allow' : config.output.overwrite;
        const pipeline = new AssetPipeline(config, options.dryRun, overwriteMode);

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
        if (options.dryRun) {
          Logger.success('Dry run simulation completed successfully!');
          Logger.info(
            `Would generate ${assets.length} assets (estimated processing time: ${metrics.processingTime}ms)`
          );
        } else {
          Logger.success('Asset generation completed successfully!');
          Logger.info(`Generated ${assets.length} assets in ${metrics.processingTime}ms`);
        }

        if (options.verbose) {
          Logger.info('');
          Logger.info('Generated assets:');
          assets.forEach(asset => {
            const displayPath = path.relative(process.cwd(), asset.path);
            Logger.info(`  - ${displayPath} (${asset.width}x${asset.height})`);
          });
        }

      } catch (error: any) {
        if (error instanceof ConfigurationNotFoundError) {
          Logger.error(`Configuration file not found: ${error.filePath}`);
          Logger.info('  → Use "assetmill init" to create a configuration file');
        } else if (error instanceof ConfigurationValidationError) {
          Logger.error('Configuration validation failed:');
          error.errors.forEach(err => Logger.error(`  → ${err}`));
          Logger.info('  → Check your configuration file for syntax and structure errors');
        } else if (error instanceof YamlParsingError) {
          Logger.error('YAML parsing failed:');
          Logger.error(`  → ${error.message}`);
          Logger.info('  → Check your YAML syntax and indentation');
        } else if (error.message.includes('Permission denied')) {
          Logger.error(`Permission denied: ${error.message}`);
          Logger.info('  → Check file permissions and try running with appropriate privileges');
        } else {
          Logger.error('Command execution failed', error as Error);
        }
        process.exit(1);
      }
    });

  return command;
}
