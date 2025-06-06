#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const generate_1 = require("./commands/generate");
const init_1 = require("./commands/init");
const validate_1 = require("./commands/validate");
const logger_1 = require("../utils/logger");
const program = new commander_1.Command();
program
    .name('assetmill')
    .description('A powerful command-line tool for automated image asset processing and optimization')
    .version('0.0.1');
program.addCommand((0, init_1.createInitCommand)());
program.addCommand((0, generate_1.createGenerateCommand)());
program.addCommand((0, validate_1.createValidateCommand)());
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
    logger_1.Logger.error('Unhandled Rejection at:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    logger_1.Logger.error('Uncaught Exception:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map