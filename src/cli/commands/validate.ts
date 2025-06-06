import { Command } from 'commander';
import { ConfigLoader } from '../../config/loader';
import { ValidationUtils } from '../../utils/validation';
import { Logger } from '../../utils/logger';

export function createValidateCommand(): Command {
  const command = new Command('validate');

  command
    .description('Validate configuration and source images')
    .option('-c, --config <path>', 'Path to configuration file', 'config.yml')
    .option('-v, --verbose', 'Enable verbose logging', false)
    .action(async (options) => {
      try {
        if (options.verbose) {
          Logger.setVerbose(true);
        }

        Logger.info('Validating configuration...');
        const configPath = options.config || ConfigLoader.findConfigFile() || 'config.yml';

        if (!configPath) {
          Logger.error('No configuration file found. Run "assetmill init" to create one.');
          process.exit(1);
        }

        const config = await ConfigLoader.load(configPath);
        Logger.success(`Configuration loaded from ${configPath}`);

        const configErrors = ValidationUtils.validateConfigPaths(config);
        if (configErrors.length > 0) {
          Logger.error('Configuration validation failed:');
          configErrors.forEach(error => Logger.error(`  ${error}`));
          process.exit(1);
        }
        Logger.success('Configuration validation passed');

        Logger.info('Validating source images...');
        const sourceImages = await ValidationUtils.validateSourceImages(config);
        Logger.success(`Validated ${sourceImages.length} source image(s)`);

        sourceImages.forEach(image => {
          Logger.info(`  ✓ ${image.path} (${image.width}x${image.height}, ${image.format})`);
        });

        Logger.info('Validating output directory...');
        const outputPermissionErrors = await ValidationUtils.validateOutputPermissions(config);
        if (outputPermissionErrors.length > 0) {
          Logger.error('Output directory validation failed:');
          outputPermissionErrors.forEach(error => Logger.error(`  ${error}`));
          process.exit(1);
        }
        await ValidationUtils.validateOutputDirectory(config.output.directory);
        Logger.success(`Output directory validated: ${config.output.directory}`);

        Logger.success('All validation checks passed!');
        Logger.info('Your configuration is ready for asset generation.');

      } catch (error) {
        Logger.error('Validation failed', error as Error);
        process.exit(1);
      }
    });

  return command;
}
