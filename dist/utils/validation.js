"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationUtils = void 0;
const file_utils_1 = require("./file-utils");
const image_processor_1 = require("../processors/image-processor");
const path_1 = __importDefault(require("path"));
class ValidationUtils {
    static async validateSourceImages(config) {
        const validatedImages = [];
        const errors = [];
        for (const imagePath of config.source.images) {
            try {
                const exists = await file_utils_1.FileUtils.fileExists(imagePath);
                if (!exists) {
                    errors.push(`Source image not found: ${imagePath}`);
                    continue;
                }
                const sourceImage = await image_processor_1.ImageProcessor.validateSourceImage(imagePath);
                if (sourceImage.format !== 'svg' &&
                    (sourceImage.width < config.source.validation.minWidth ||
                        sourceImage.height < config.source.validation.minHeight)) {
                    errors.push(`Image ${imagePath} is smaller than minimum required size ` +
                        `(${config.source.validation.minWidth}x${config.source.validation.minHeight})`);
                    continue;
                }
                const fileSize = await file_utils_1.FileUtils.getFileSize(imagePath);
                if (fileSize > config.source.validation.maxFileSize) {
                    errors.push(`Image ${imagePath} exceeds maximum file size ` +
                        `(${file_utils_1.FileUtils.formatFileSize(config.source.validation.maxFileSize)})`);
                    continue;
                }
                validatedImages.push(sourceImage);
            }
            catch (error) {
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
    static validateAssetVariant(variant) {
        const errors = [];
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
        return errors;
    }
    static async validateOutputDirectory(outputDir) {
        try {
            await file_utils_1.FileUtils.ensureDirectory(outputDir);
        }
        catch (error) {
            throw new Error(`Cannot create output directory ${outputDir}: ${error}`);
        }
    }
    static validateConfigPaths(config) {
        const errors = [];
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
    static validateDuplicateOutputPaths(config) {
        const errors = [];
        const outputPaths = new Map();
        config.assets.forEach((asset) => {
            const baseOutputPath = asset.outputPath || './';
            asset.variants.forEach((variant) => {
                const fullOutputPath = path_1.default.join(config.output.directory, baseOutputPath, `${variant.name}.${variant.format}`).replace(/\\/g, '/');
                if (!outputPaths.has(fullOutputPath)) {
                    outputPaths.set(fullOutputPath, []);
                }
                outputPaths.get(fullOutputPath).push(`${asset.name}.${variant.name}`);
            });
        });
        outputPaths.forEach((sources, outputPath) => {
            if (sources.length > 1) {
                errors.push(`Duplicate output file detected: ${outputPath} would be generated by multiple sources: ${sources.join(', ')}`);
            }
        });
        return errors;
    }
    static isValidImageFormat(format) {
        return image_processor_1.ImageProcessor.getSupportedInputFormats().includes(format.toLowerCase());
    }
    static isValidOutputFormat(format) {
        return image_processor_1.ImageProcessor.getSupportedOutputFormats().includes(format.toLowerCase());
    }
    /**
     * Validates that all configured output formats are supported by the image processor.
     *
     * @param config The pipeline configuration to validate
     * @returns Array of validation error messages
     */
    static validateFormatSupport(config) {
        const errors = [];
        const supportedOutputFormats = image_processor_1.ImageProcessor.getSupportedOutputFormats();
        config.output.formats.forEach(format => {
            if (!supportedOutputFormats.includes(format.toLowerCase())) {
                errors.push(`Unsupported output format '${format}'. ` +
                    `Supported formats: ${supportedOutputFormats.join(', ')}`);
            }
        });
        config.assets.forEach(asset => {
            asset.variants.forEach(variant => {
                if (!supportedOutputFormats.includes(variant.format.toLowerCase())) {
                    errors.push(`Asset '${asset.name}', variant '${variant.name}': ` +
                        `Unsupported output format '${variant.format}'. ` +
                        `Supported formats: ${supportedOutputFormats.join(', ')}`);
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
    static validateQualitySettings(config) {
        const errors = [];
        Object.entries(config.processing.quality).forEach(([format, quality]) => {
            if (quality < 1 || quality > 100) {
                errors.push(`Quality for ${format} must be between 1 and 100, got ${quality}`);
            }
        });
        config.assets.forEach(asset => {
            asset.variants.forEach(variant => {
                if (variant.quality && (variant.quality < 1 || variant.quality > 100)) {
                    errors.push(`Asset '${asset.name}', variant '${variant.name}': ` +
                        `Quality must be between 1 and 100, got ${variant.quality}`);
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
    static async validateOutputPermissions(config) {
        const errors = [];
        try {
            await file_utils_1.FileUtils.ensureDirectory(config.output.directory);
            const testFile = path_1.default.join(config.output.directory, '.assetmill-test');
            await file_utils_1.FileUtils.writeTextFile(testFile, 'test');
            await file_utils_1.FileUtils.deleteFile(testFile);
        }
        catch (error) {
            errors.push(`Cannot write to output directory '${config.output.directory}': ${error}`);
        }
        return errors;
    }
}
exports.ValidationUtils = ValidationUtils;
//# sourceMappingURL=validation.js.map