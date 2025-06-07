/**
 * Custom error class for file existence conflicts during asset generation.
 * Thrown when attempting to write to a file that already exists and overwrite mode is 'error'.
 */
export class FileExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileExistsError';
  }
}
