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

/**
 * Custom error class for configuration file not found scenarios.
 */
export class ConfigurationNotFoundError extends Error {
  constructor(message: string, public readonly filePath: string) {
    super(message);
    this.name = 'ConfigurationNotFoundError';
  }
}

/**
 * Custom error class for configuration validation failures.
 */
export class ConfigurationValidationError extends Error {
  constructor(message: string, public readonly errors: string[]) {
    super(message);
    this.name = 'ConfigurationValidationError';
  }
}

/**
 * Custom error class for YAML parsing failures with line information.
 */
export class YamlParsingError extends Error {
  constructor(message: string, public readonly line?: number, public readonly column?: number) {
    super(message);
    this.name = 'YamlParsingError';
  }
}
