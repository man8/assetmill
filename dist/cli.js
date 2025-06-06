#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const generate_1 = require("./cli/commands/generate");
const init_1 = require("./cli/commands/init");
const validate_1 = require("./cli/commands/validate");
commander_1.program
    .name('assetmill')
    .description('CLI tool for automated image asset generation and optimization')
    .version('0.0.1');
commander_1.program.addCommand((0, generate_1.createGenerateCommand)());
commander_1.program.addCommand((0, init_1.createInitCommand)());
commander_1.program.addCommand((0, validate_1.createValidateCommand)());
commander_1.program.parse();
//# sourceMappingURL=cli.js.map