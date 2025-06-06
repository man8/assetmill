"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGenerateCommand = createGenerateCommand;
const commander_1 = require("commander");
const loader_1 = require("../../config/loader");
const asset_pipeline_1 = require("../../pipeline/asset-pipeline");
const logger_1 = require("../../utils/logger");
const path = __importStar(require("path"));
function createGenerateCommand() {
    const command = new commander_1.Command('generate');
    command
        .description('Generate image assets from source images')
        .option('-c, --config <path>', 'Path to configuration file', 'config.yml')
        .option('-o, --output <path>', 'Output directory (overrides config)')
        .option('-d, --dry-run', 'Preview operations without generating files', false)
        .option('-v, --verbose', 'Enable verbose logging', false)
        .option('-f, --force', 'Overwrite existing files', false)
        .option('-q, --quality <number>', 'Override quality setting (1-100)', parseInt)
        .option('--format <formats...>', 'Override output formats (png,jpeg,webp,avif)')
        .action(async (options) => {
        try {
            if (options.verbose) {
                logger_1.Logger.setLevel(logger_1.LogLevel.DEBUG);
            }
            logger_1.Logger.info('Loading configuration...');
            const configPath = options.config || loader_1.ConfigLoader.findConfigFile() || 'config.yml';
            if (!configPath) {
                logger_1.Logger.error('No configuration file found. Run "assetmill init" to create one.');
                process.exit(1);
            }
            const config = await loader_1.ConfigLoader.load(configPath);
            logger_1.Logger.info('Validating configuration...');
            const { ValidationUtils } = await Promise.resolve().then(() => __importStar(require('../../utils/validation')));
            const configErrors = ValidationUtils.validateConfigPaths(config);
            if (configErrors.length > 0) {
                logger_1.Logger.error('Configuration validation failed:');
                configErrors.forEach(error => logger_1.Logger.error(`  ${error}`));
                process.exit(1);
            }
            const outputPermissionErrors = await ValidationUtils.validateOutputPermissions(config);
            if (outputPermissionErrors.length > 0) {
                logger_1.Logger.error('Output directory validation failed:');
                outputPermissionErrors.forEach(error => logger_1.Logger.error(`  ${error}`));
                process.exit(1);
            }
            if (options.output) {
                config.output.directory = options.output;
            }
            if (options.quality) {
                Object.keys(config.processing.quality).forEach(format => {
                    config.processing.quality[format] = options.quality;
                });
            }
            if (options.format) {
                config.output.formats = options.format;
            }
            const pipeline = new asset_pipeline_1.AssetPipeline(config, options.dryRun);
            logger_1.Logger.info('Starting asset generation...');
            const result = await pipeline.execute();
            if (!result.success) {
                logger_1.Logger.error('Pipeline execution failed:');
                result.errors.forEach(error => {
                    logger_1.Logger.error(`  ${error.message}`);
                });
                process.exit(1);
            }
            const { assets, metrics } = result;
            logger_1.Logger.info('');
            logger_1.Logger.success('Asset generation completed successfully!');
            logger_1.Logger.info(`Generated ${assets.length} assets in ${metrics.processingTime}ms`);
            if (options.verbose) {
                logger_1.Logger.info('');
                logger_1.Logger.info('Generated assets:');
                assets.forEach(asset => {
                    const displayPath = path.relative(process.cwd(), asset.path);
                    logger_1.Logger.info(`  - ${displayPath} (${asset.width}x${asset.height})`);
                });
            }
        }
        catch (error) {
            logger_1.Logger.error('Command execution failed', error);
            process.exit(1);
        }
    });
    return command;
}
function formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}
//# sourceMappingURL=generate.js.map