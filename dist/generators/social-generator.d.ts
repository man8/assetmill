import { SourceImage, GeneratedAsset, PipelineConfig } from '../types';
export declare class SocialGenerator {
    static generate(sourceImage: SourceImage, config: PipelineConfig, outputDir: string): Promise<GeneratedAsset[]>;
    static generateMetaTags(assets: GeneratedAsset[], baseUrl?: string, siteTitle?: string): string[];
    static generateStructuredData(assets: GeneratedAsset[], baseUrl?: string, organisation?: Record<string, unknown>): string;
}
//# sourceMappingURL=social-generator.d.ts.map