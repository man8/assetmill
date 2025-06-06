"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
const chalk_1 = __importDefault(require("chalk"));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    static setLevel(level) {
        this.level = level;
    }
    static setVerbose(verbose) {
        this.verbose = verbose;
        if (verbose) {
            this.level = LogLevel.DEBUG;
        }
    }
    static error(message, error) {
        if (this.level >= LogLevel.ERROR) {
            console.error(chalk_1.default.red('✗'), message);
            if (error && this.verbose) {
                console.error(chalk_1.default.red(error.stack || error.message));
            }
        }
    }
    static warn(message) {
        if (this.level >= LogLevel.WARN) {
            console.warn(chalk_1.default.yellow('⚠'), message);
        }
    }
    static info(message) {
        if (this.level >= LogLevel.INFO) {
            console.log(chalk_1.default.blue('ℹ'), message);
        }
    }
    static success(message) {
        if (this.level >= LogLevel.INFO) {
            console.log(chalk_1.default.green('✓'), message);
        }
    }
    static debug(message) {
        if (this.level >= LogLevel.DEBUG) {
            console.log(chalk_1.default.gray('•'), message);
        }
    }
    static progress(message) {
        if (this.level >= LogLevel.INFO) {
            console.log(chalk_1.default.cyan('→'), message);
        }
    }
}
exports.Logger = Logger;
Logger.level = LogLevel.INFO;
Logger.verbose = false;
//# sourceMappingURL=logger.js.map