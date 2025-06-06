"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitCommand = createInitCommand;
const commander_1 = require("commander");
const path_1 = __importDefault(require("path"));
const loader_1 = require("../../config/loader");
const file_utils_1 = require("../../utils/file-utils");
const logger_1 = require("../../utils/logger");
function createInitCommand() {
    const command = new commander_1.Command('init');
    command
        .description('Initialise a new asset pipeline configuration')
        .option('-o, --output <path>', 'Output path for configuration file', 'config.yml')
        .option('-f, --force', 'Overwrite existing configuration file', false)
        .action(async (options) => {
        try {
            const configPath = path_1.default.resolve(options.output);
            if (!options.force && await file_utils_1.FileUtils.fileExists(configPath)) {
                logger_1.Logger.error(`Configuration file already exists: ${configPath}`);
                logger_1.Logger.info('Use --force to overwrite the existing file');
                process.exit(1);
            }
            logger_1.Logger.info('Generating configuration template...');
            await loader_1.ConfigLoader.generateTemplate(configPath);
            logger_1.Logger.success(`Configuration file created: ${configPath}`);
            logger_1.Logger.info('');
            logger_1.Logger.info('Next steps:');
            logger_1.Logger.info('1. Place your source image file(s) in the current directory');
            logger_1.Logger.info('2. Edit the configuration file to match your requirements');
            logger_1.Logger.info('3. Run "assetmill generate" to create your assets');
            logger_1.Logger.info('');
            logger_1.Logger.info('Example source files:');
            logger_1.Logger.info('  - logo.svg (recommended for best quality)');
            logger_1.Logger.info('  - logo.png (minimum 512x512 pixels)');
        }
        catch (error) {
            logger_1.Logger.error('Failed to initialise configuration', error);
            process.exit(1);
        }
    });
    return command;
}
//# sourceMappingURL=init.js.map