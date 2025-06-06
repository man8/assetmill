import { SourceImage, GeneratedAsset, PipelineConfig } from '../types';
export declare class LogoGenerator {
    static generate(sourceImage: SourceImage, config: PipelineConfig, outputDir: string): Promise<GeneratedAsset[]>;
    private static generateSizeVariants;
    static generateCssVariables(assets: GeneratedAsset[], baseUrl?: string): string;
}
//# sourceMappingURL=logo-generator.d.ts.map