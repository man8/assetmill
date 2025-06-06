import { PipelineConfig } from '../types';
export declare class ConfigLoader {
    static load(configPath: string): Promise<PipelineConfig>;
    static generateTemplate(outputPath: string): Promise<void>;
    static findConfigFile(startDir?: string): string | null;
}
//# sourceMappingURL=loader.d.ts.map