import * as path from 'path';
import * as os from 'os';

/**
 * Normalizes a file path by converting all path separators to forward slashes.
 * This ensures consistent path representation across different platforms.
 * 
 * @param filePath The file path to normalize
 * @returns The normalized path with forward slashes
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Compares two file paths for equality after normalizing them.
 * This handles platform differences in path separators.
 * 
 * @param path1 First path to compare
 * @param path2 Second path to compare
 * @returns True if the normalized paths are equal
 */
export function comparePathsEqual(path1: string, path2: string): boolean {
  return normalizePath(path1) === normalizePath(path2);
}

/**
 * Creates a platform-appropriate temporary directory path.
 * 
 * @param subPath Optional subdirectory within the temp directory
 * @returns Absolute path to temporary directory
 */
export function getTempPath(subPath?: string): string {
  return subPath ? path.resolve(os.tmpdir(), subPath) : os.tmpdir();
}
