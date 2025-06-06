"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValidateCommand = createValidateCommand;
const commander_1 = require("commander");
const loader_1 = require("../../config/loader");
const validation_1 = require("../../utils/validation");
const logger_1 = require("../../utils/logger");
function createValidateCommand() {
    const command = new commander_1.Command('validate');
    command
        .description('Validate configuration and source images')
        .option('-c, --config <path>', 'Path to configuration file', 'config.yml')
        .option('-v, --verbose', 'Enable verbose logging', false)
        .action(async (options) => {
        try {
            if (options.verbose) {
                logger_1.Logger.setVerbose(true);
            }
            logger_1.Logger.info('Validating configuration...');
            const configPath = options.config || loader_1.ConfigLoader.findConfigFile() || 'config.yml';
            if (!configPath) {
                logger_1.Logger.error('No configuration file found. Run "assetmill init" to create one.');
                process.exit(1);
            }
            const config = await loader_1.ConfigLoader.load(configPath);
            logger_1.Logger.success(`Configuration loaded from ${configPath}`);
            const configErrors = validation_1.ValidationUtils.validateConfigPaths(config);
            if (configErrors.length > 0) {
                logger_1.Logger.error('Configuration validation failed:');
                configErrors.forEach(error => logger_1.Logger.error(`  ${error}`));
                process.exit(1);
            }
            logger_1.Logger.success('Configuration validation passed');
            logger_1.Logger.info('Validating source images...');
            const sourceImages = await validation_1.ValidationUtils.validateSourceImages(config);
            logger_1.Logger.success(`Validated ${sourceImages.length} source image(s)`);
            sourceImages.forEach(image => {
                logger_1.Logger.info(`  ✓ ${image.path} (${image.width}x${image.height}, ${image.format})`);
            });
            logger_1.Logger.info('Validating output directory...');
            const outputPermissionErrors = await validation_1.ValidationUtils.validateOutputPermissions(config);
            if (outputPermissionErrors.length > 0) {
                logger_1.Logger.error('Output directory validation failed:');
                outputPermissionErrors.forEach(error => logger_1.Logger.error(`  ${error}`));
                process.exit(1);
            }
            await validation_1.ValidationUtils.validateOutputDirectory(config.output.directory);
            logger_1.Logger.success(`Output directory validated: ${config.output.directory}`);
            logger_1.Logger.success('All validation checks passed!');
            logger_1.Logger.info('Your configuration is ready for asset generation.');
        }
        catch (error) {
            logger_1.Logger.error('Validation failed', error);
            process.exit(1);
        }
    });
    return command;
}
//# sourceMappingURL=validate.js.map