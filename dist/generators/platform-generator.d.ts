import { SourceImage, GeneratedAsset, PipelineConfig, PlatformConfig } from '../types';
export declare class PlatformGenerator {
    static generate(sourceImage: SourceImage, config: PipelineConfig, outputDir: string): Promise<GeneratedAsset[]>;
    private static generatePlatformAssets;
    static getGoogleWorkspaceConfig(): PlatformConfig;
    static getSlackConfig(): PlatformConfig;
    static getDiscordConfig(): PlatformConfig;
    static getGitHubConfig(): PlatformConfig;
}
//# sourceMappingURL=platform-generator.d.ts.map