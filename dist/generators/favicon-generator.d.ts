import { SourceImage, GeneratedAsset, PipelineConfig } from '../types';
export declare class FaviconGenerator {
    static generate(sourceImage: SourceImage, config: PipelineConfig, outputDir: string): Promise<GeneratedAsset[]>;
    static generateWebmanifest(assets: GeneratedAsset[], baseUrl?: string): string;
    static generateBrowserConfigXml(assets: GeneratedAsset[], baseUrl?: string): string;
    static generateHtmlTags(assets: GeneratedAsset[], baseUrl?: string): string[];
}
//# sourceMappingURL=favicon-generator.d.ts.map