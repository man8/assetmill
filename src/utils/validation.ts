import { PipelineConfig, SourceImage, AssetVariant, MarginConfig } from '../types';
import { FileUtils } from './file-utils';
import { ImageProcessor } from '../processors/image-processor';
import { normalizePath } from './path-utils';
import path from 'path';

export class ValidationUtils {
  /**
   * Checks if a MarginConfig has any properties defined.
   * 
   * @param margin The margin configuration to check
   * @returns true if any margin properties are defined, false otherwise
   */
  private static hasMarginDefined(margin: MarginConfig | undefined): boolean {
    if (!margin) return false;
    
    return margin.top !== undefined ||
           margin.right !== undefined ||
           margin.bottom !== undefined ||
           margin.left !== undefined ||
           margin.horizontal !== undefined ||
           margin.vertical !== undefined ||
           margin.all !== undefined;
  }

  static async validateSourceImages(config: PipelineConfig): Promise<SourceImage[]> {
    const validatedImages: SourceImage[] = [];
    const errors: string[] = [];

    for (const imagePath of config.source.images) {
      try {
        const exists = await FileUtils.fileExists(imagePath);
        if (!exists) {
          errors.push(`Source image not found: ${imagePath}`);
          continue;
        }

        const sourceImage = await ImageProcessor.validateSourceImage(imagePath);

        if (sourceImage.format !== 'svg' && 
            (sourceImage.width < config.source.validation.minWidth ||
             sourceImage.height < config.source.validation.minHeight)) {
          errors.push(
            `Image ${imagePath} is smaller than minimum required size ` +
            `(${config.source.validation.minWidth}x${config.source.validation.minHeight})`
          );
          continue;
        }

        const fileSize = await FileUtils.getFileSize(imagePath);
        if (fileSize > config.source.validation.maxFileSize) {
          errors.push(
            `Image ${imagePath} exceeds maximum file size ` +
            `(${FileUtils.formatFileSize(config.source.validation.maxFileSize)})`
          );
          continue;
        }

        validatedImages.push(sourceImage);
      } catch (error) {
        errors.push(`Failed to validate ${imagePath}: ${error}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Source image validation failed:\n${errors.join('\n')}`);
    }

    if (validatedImages.length === 0) {
      throw new Error('No valid source images found');
    }

    return validatedImages;
  }

  static validateAssetVariant(variant: AssetVariant): string[] {
    const errors: string[] = [];

    if (!variant.name) {
      errors.push('Asset variant must have a name');
    }

    if (!variant.format) {
      errors.push('Asset variant must specify a format');
    }

    if (variant.quality && (variant.quality < 1 || variant.quality > 100)) {
      errors.push('Quality must be between 1 and 100');
    }

    if (variant.width && variant.width < 1) {
      errors.push('Width must be greater than 0');
    }

    if (variant.height && variant.height < 1) {
      errors.push('Height must be greater than 0');
    }

    if (variant.format === 'svg' && this.hasMarginDefined(variant.margin)) {
      errors.push(
        'Margin settings are not supported for SVG output format. ' +
        'SVG processing uses markup transformation rather than canvas manipulation. ' +
        'Use a raster format (PNG, JPEG, WebP, AVIF, ICO) if margins are required.'
      );
    }

    return errors;
  }

  static async validateOutputDirectory(outputDir: string): Promise<void> {
    try {
      await FileUtils.ensureDirectory(outputDir);
    } catch (error) {
      throw new Error(`Cannot create output directory ${outputDir}: ${error}`);
    }
  }

  static validateConfigPaths(config: PipelineConfig): string[] {
    const errors: string[] = [];

    if (!config.output.directory) {
      errors.push('Output directory must be specified');
    }

    config.assets.forEach((asset) => {
      asset.variants.forEach((variant, variantIndex) => {
        const variantErrors = this.validateAssetVariant(variant);
        variantErrors.forEach(error => {
          errors.push(`Asset ${asset.name}, variant ${variantIndex}: ${error}`);
        });
      });
    });

    const formatErrors = this.validateFormatSupport(config);
    errors.push(...formatErrors);

    const qualityErrors = this.validateQualitySettings(config);
    errors.push(...qualityErrors);

    const duplicateErrors = this.validateDuplicateOutputPaths(config);
    errors.push(...duplicateErrors);

    return errors;
  }

  static validateDuplicateOutputPaths(config: PipelineConfig): string[] {
    const errors: string[] = [];
    const outputPaths = new Map<string, string[]>();

    config.assets.forEach((asset) => {
      const baseOutputPath = asset.outputPath || './';
      
      asset.variants.forEach((variant) => {
        const fullOutputPath = normalizePath(path.join(
          config.output.directory,
          baseOutputPath,
          `${variant.name}.${variant.format}`
        ));
        
        if (!outputPaths.has(fullOutputPath)) {
          outputPaths.set(fullOutputPath, []);
        }
        outputPaths.get(fullOutputPath)!.push(`${asset.name}.${variant.name}`);
      });
    });

    outputPaths.forEach((sources, outputPath) => {
      if (sources.length > 1) {
        errors.push(
          `Duplicate output file detected: ${outputPath} would be generated by multiple sources: ${sources.join(', ')}`
        );
      }
    });

    return errors;
  }

  static isValidImageFormat(format: string): boolean {
    return ImageProcessor.getSupportedInputFormats().includes(format.toLowerCase());
  }

  static isValidOutputFormat(format: string): boolean {
    return ImageProcessor.getSupportedOutputFormats().includes(format.toLowerCase());
  }

  /**
   * Validates that all configured output formats are supported by the image processor.
   * 
   * @param config The pipeline configuration to validate
   * @returns Array of validation error messages
   */
  static validateFormatSupport(config: PipelineConfig): string[] {
    const errors: string[] = [];
    const supportedOutputFormats = ImageProcessor.getSupportedOutputFormats();

    config.output.formats.forEach(format => {
      if (!supportedOutputFormats.includes(format.toLowerCase())) {
        errors.push(
          `Unsupported output format '${format}'. ` +
          `Supported formats: ${supportedOutputFormats.join(', ')}`
        );
      }
    });

    config.assets.forEach(asset => {
      asset.variants.forEach(variant => {
        if (!supportedOutputFormats.includes(variant.format.toLowerCase())) {
          errors.push(
            `Asset '${asset.name}', variant '${variant.name}': ` +
            `Unsupported output format '${variant.format}'. ` +
            `Supported formats: ${supportedOutputFormats.join(', ')}`
          );
        }
      });
    });

    return errors;
  }

  /**
   * Validates quality settings are within acceptable ranges (1-100).
   * 
   * @param config The pipeline configuration to validate
   * @returns Array of validation error messages
   */
  static validateQualitySettings(config: PipelineConfig): string[] {
    const errors: string[] = [];

    Object.entries(config.processing.quality).forEach(([format, quality]) => {
      if (quality < 1 || quality > 100) {
        errors.push(`Quality for ${format} must be between 1 and 100, got ${quality}`);
      }
    });

    config.assets.forEach(asset => {
      asset.variants.forEach(variant => {
        if (variant.quality && (variant.quality < 1 || variant.quality > 100)) {
          errors.push(
            `Asset '${asset.name}', variant '${variant.name}': ` +
            `Quality must be between 1 and 100, got ${variant.quality}`
          );
        }
      });
    });

    return errors;
  }

  /**
   * Validates that the output directory can be created and written to.
   * 
   * @param config The pipeline configuration to validate
   * @returns Array of validation error messages
   */
  static async validateOutputPermissions(config: PipelineConfig): Promise<string[]> {
    const errors: string[] = [];

    try {
      await FileUtils.ensureDirectory(config.output.directory);
      
      const testFile = path.join(config.output.directory, '.assetmill-test');
      await FileUtils.writeTextFile(testFile, 'test');
      await FileUtils.deleteFile(testFile);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'EACCES') {
        errors.push(`Permission denied: Cannot write to output directory ${config.output.directory}`);
      } else if (err.code === 'ENOENT') {
        errors.push(`Output directory does not exist and cannot be created: ${config.output.directory}`);
      } else if (err.code === 'EMFILE' || err.code === 'ENFILE') {
        errors.push(`Too many open files: Cannot create output directory ${config.output.directory}`);
      } else if (err.code === 'ENOSPC') {
        errors.push(`No space left on device: Cannot create output directory ${config.output.directory}`);
      } else {
        errors.push(`Cannot write to output directory ${config.output.directory}: ${err.message || 'unknown error'}`);
      }
    }

    return errors;
  }
}
