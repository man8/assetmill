import { PipelineConfig, SourceImage, AssetVariant } from '../types';
export declare class ValidationUtils {
    static validateSourceImages(config: PipelineConfig): Promise<SourceImage[]>;
    static validateAssetVariant(variant: AssetVariant): string[];
    static validateOutputDirectory(outputDir: string): Promise<void>;
    static validateConfigPaths(config: PipelineConfig): string[];
    static validateDuplicateOutputPaths(config: PipelineConfig): string[];
    static isValidImageFormat(format: string): boolean;
    static isValidOutputFormat(format: string): boolean;
    /**
     * Validates that all configured output formats are supported by the image processor.
     *
     * @param config The pipeline configuration to validate
     * @returns Array of validation error messages
     */
    static validateFormatSupport(config: PipelineConfig): string[];
    /**
     * Validates quality settings are within acceptable ranges (1-100).
     *
     * @param config The pipeline configuration to validate
     * @returns Array of validation error messages
     */
    static validateQualitySettings(config: PipelineConfig): string[];
    /**
     * Validates that the output directory can be created and written to.
     *
     * @param config The pipeline configuration to validate
     * @returns Array of validation error messages
     */
    static validateOutputPermissions(config: PipelineConfig): Promise<string[]>;
}
//# sourceMappingURL=validation.d.ts.map