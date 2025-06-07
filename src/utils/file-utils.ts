import * as fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { OverwriteMode } from '../types';
import { FileExistsError } from './errors';

export class FileUtils {
  static async ensureDirectory(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }

  static async fileExists(filePath: string): Promise<boolean> {
    return fs.pathExists(filePath);
  }

  static async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }

  static async findFiles(pattern: string, cwd: string = process.cwd()): Promise<string[]> {
    return glob(pattern, { cwd, absolute: true });
  }

  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  static getRelativePath(from: string, to: string): string {
    return path.relative(from, to);
  }

  static async copyFile(source: string, destination: string): Promise<void> {
    await fs.ensureDir(path.dirname(destination));
    await fs.copy(source, destination);
  }

  static async deleteFile(filePath: string): Promise<void> {
    if (await this.fileExists(filePath)) {
      await fs.remove(filePath);
    }
  }

  static async readJsonFile<T>(filePath: string): Promise<T> {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  }

  static async writeJsonFile(filePath: string, data: unknown): Promise<void> {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  static async writeTextFile(filePath: string, content: string): Promise<void> {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf8');
  }

  static getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase().slice(1);
  }

  static getBaseName(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  static async checkOverwritePermission(
    filePath: string, 
    mode: OverwriteMode
  ): Promise<void> {
    const exists = await this.fileExists(filePath);
    if (!exists) return;
    
    if (mode === 'error') {
      throw new FileExistsError(`Output file already exists: ${filePath}`);
    } else if (mode === 'warn') {
      const { Logger } = await import('./logger');
      Logger.warn(`Overwriting existing file: ${filePath}`);
    }
  }
}
