import { SourceImage, AssetVariant, ProcessingOptions, GeneratedAsset, PipelineConfig } from '../types';
export declare class ImageProcessor {
    private static readonly SUPPORTED_INPUT_FORMATS;
    private static readonly SUPPORTED_OUTPUT_FORMATS;
    /**
     * Returns the list of supported output formats for validation purposes.
     *
     * @returns Array of supported output format strings
     */
    static getSupportedOutputFormats(): string[];
    /**
     * Returns the list of supported input formats for validation purposes.
     *
     * @returns Array of supported input format strings
     */
    static getSupportedInputFormats(): string[];
    /**
     * Converts a hex color string to Sharp.js RGB format.
     *
     * @param hexColor Hex color string (e.g., "#ffffff" or "#fff")
     * @returns Sharp RGB object with r, g, b, alpha properties
     */
    private static hexToRgb;
    /**
     * Parses background color from string or object format to Sharp RGB format.
     *
     * @param background Background color as hex string or RGB object
     * @returns Sharp RGB object with r, g, b, alpha properties
     */
    private static parseBackgroundColor;
    static processImage(sourceImage: SourceImage, variant: AssetVariant, outputPath: string, options?: ProcessingOptions, config?: PipelineConfig): Promise<GeneratedAsset>;
    private static applyMargin;
    private static calculateMargins;
    private static getDefaultQuality;
    static validateSourceImage(imagePath: string): Promise<SourceImage>;
    static generateFavicon(sourceImage: SourceImage, outputPath: string): Promise<GeneratedAsset[]>;
    private static createIcoFile;
    /**
     * Generates a multi-size ICO file with standard favicon sizes.
     *
     * @param sourceImage Source image to process
     * @param variant Asset variant configuration
     * @param outputPath Path to write the ICO file
     * @returns Generated asset metadata
     */
    static generateMultiSizeIcoFile(sourceImage: SourceImage, variant: AssetVariant, outputPath: string, options?: ProcessingOptions, config?: PipelineConfig): Promise<GeneratedAsset>;
    /**
     * Generates a single-size ICO file.
     *
     * @param sourceImage Source image to process
     * @param variant Asset variant configuration
     * @param outputPath Path to write the ICO file
     * @returns Generated asset metadata
     */
    private static parseMonochromeConfig;
    private static applyMonochromeTheme;
    static generateSingleIcoFile(sourceImage: SourceImage, variant: AssetVariant, outputPath: string): Promise<GeneratedAsset>;
}
//# sourceMappingURL=image-processor.d.ts.map