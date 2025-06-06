export declare class FileUtils {
    static ensureDirectory(dirPath: string): Promise<void>;
    static fileExists(filePath: string): Promise<boolean>;
    static getFileSize(filePath: string): Promise<number>;
    static findFiles(pattern: string, cwd?: string): Promise<string[]>;
    static formatFileSize(bytes: number): string;
    static getRelativePath(from: string, to: string): string;
    static copyFile(source: string, destination: string): Promise<void>;
    static deleteFile(filePath: string): Promise<void>;
    static readJsonFile<T>(filePath: string): Promise<T>;
    static writeJsonFile(filePath: string, data: unknown): Promise<void>;
    static writeTextFile(filePath: string, content: string): Promise<void>;
    static getFileExtension(filePath: string): string;
    static getBaseName(filePath: string): string;
}
//# sourceMappingURL=file-utils.d.ts.map