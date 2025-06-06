export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
export declare class Logger {
    private static level;
    private static verbose;
    static setLevel(level: LogLevel): void;
    static setVerbose(verbose: boolean): void;
    static error(message: string, error?: Error): void;
    static warn(message: string): void;
    static info(message: string): void;
    static success(message: string): void;
    static debug(message: string): void;
    static progress(message: string): void;
}
//# sourceMappingURL=logger.d.ts.map