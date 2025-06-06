import { PipelineConfig, ProcessingResult } from '../types';
export declare class AssetPipeline {
    private config;
    private dryRun;
    constructor(config: PipelineConfig, dryRun?: boolean);
    execute(): Promise<ProcessingResult>;
    private processSourceImage;
    private generateCustomAssets;
    private simulateAssetGeneration;
    private calculateMetrics;
    generateManifestFiles(): Promise<void>;
    private shouldGenerateDefaultAssets;
    private shouldGenerateCustomAsset;
    private getAssetsByType;
}
//# sourceMappingURL=asset-pipeline.d.ts.map