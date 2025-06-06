import chalk from 'chalk';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export class Logger {
  private static level: LogLevel = LogLevel.INFO;
  private static verbose: boolean = false;

  static setLevel(level: LogLevel): void {
    this.level = level;
  }

  static setVerbose(verbose: boolean): void {
    this.verbose = verbose;
    if (verbose) {
      this.level = LogLevel.DEBUG;
    }
  }

  static error(message: string, error?: Error): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(chalk.red('✗'), message);
      if (error && this.verbose) {
        console.error(chalk.red(error.stack || error.message));
      }
    }
  }

  static warn(message: string): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(chalk.yellow('⚠'), message);
    }
  }

  static info(message: string): void {
    if (this.level >= LogLevel.INFO) {
      console.log(chalk.blue('ℹ'), message);
    }
  }

  static success(message: string): void {
    if (this.level >= LogLevel.INFO) {
      console.log(chalk.green('✓'), message);
    }
  }

  static debug(message: string): void {
    if (this.level >= LogLevel.DEBUG) {
      console.log(chalk.gray('•'), message);
    }
  }

  static progress(message: string): void {
    if (this.level >= LogLevel.INFO) {
      console.log(chalk.cyan('→'), message);
    }
  }
}
