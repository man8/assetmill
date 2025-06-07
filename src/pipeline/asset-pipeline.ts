import path from 'path';
import { 
  PipelineConfig, 
  SourceImage, 
  GeneratedAsset, 
  ProcessingResult, 
  ProcessingMetrics, 
  AssetVariant, 
  MarginConfig, 
  ThemeVariant,
  AssetDefinition,
  OutputFormat,
  OverwriteMode 
} from '../types';
import { FaviconGenerator } from '../generators/favicon-generator';
import { SocialGenerator } from '../generators/social-generator';
import { LogoGenerator } from '../generators/logo-generator';
import { PlatformGenerator } from '../generators/platform-generator';
import { ValidationUtils } from '../utils/validation';
import { FileUtils } from '../utils/file-utils';
import { Logger } from '../utils/logger';

export class AssetPipeline {
  private config: PipelineConfig;
  private dryRun: boolean;
  private overwriteMode: OverwriteMode;

  constructor(config: PipelineConfig, dryRun: boolean = false, overwriteMode?: OverwriteMode) {
    this.config = config;
    this.dryRun = dryRun;
    this.overwriteMode = overwriteMode || config.output.overwrite;
  }

  async execute(): Promise<ProcessingResult> {
    const startTime = Date.now();
    const result: ProcessingResult = {
      success: false,
      assets: [],
      errors: [],
      metrics: {
        totalAssets: 0,
        successfulAssets: 0,
        failedAssets: 0,
        totalFileSize: 0,
        processingTime: 0,
      },
    };

    try {
      Logger.info('Starting image asset pipeline...');

      const validationErrors = ValidationUtils.validateConfigPaths(this.config);
      if (validationErrors.length > 0) {
        result.errors.push({ message: `Configuration validation failed:\n${validationErrors.join('\n')}` });
        return result;
      }

      const sourceImages = await ValidationUtils.validateSourceImages(this.config);
      Logger.success(`Validated ${sourceImages.length} source image(s)`);

      if (!this.dryRun) {
        await ValidationUtils.validateOutputDirectory(this.config.output.directory);
      }

      for (const sourceImage of sourceImages) {
        Logger.info(`Processing source image: ${path.basename(sourceImage.path)}`);

        const imageAssets = await this.processSourceImage(sourceImage);
        result.assets.push(...imageAssets);
      }

      result.success = true;
      result.metrics = this.calculateMetrics(result.assets, startTime);

      Logger.success(`Pipeline completed successfully!`);
      Logger.info(`Generated ${result.assets.length} assets`);
      Logger.info(`Total file size: ${FileUtils.formatFileSize(result.metrics.totalFileSize)}`);
      Logger.info(`Processing time: ${result.metrics.processingTime}ms`);

    } catch (error) {
      Logger.error('Pipeline execution failed', error as Error);
      result.errors.push({
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }

    return result;
  }

  private async processSourceImage(sourceImage: SourceImage): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];

    if (this.dryRun) {
      Logger.info('Dry run mode - skipping actual file generation');
      return this.simulateAssetGeneration();
    }

    try {
      const shouldGenerateDefaults = this.shouldGenerateDefaultAssets(sourceImage);

      if (shouldGenerateDefaults.favicon) {
        Logger.progress('Generating favicon assets...');
        const faviconAssets = await FaviconGenerator.generate(sourceImage, this.config, this.config.output.directory);
        assets.push(...faviconAssets);
        Logger.success(`Generated ${faviconAssets.length} favicon assets`);
      }

      if (shouldGenerateDefaults.social) {
        Logger.progress('Generating social media assets...');
        const socialAssets = await SocialGenerator.generate(sourceImage, this.config, this.config.output.directory);
        assets.push(...socialAssets);
        Logger.success(`Generated ${socialAssets.length} social media assets`);
      }

      if (shouldGenerateDefaults.logos) {
        Logger.progress('Generating logo variants...');
        const logoAssets = await LogoGenerator.generate(sourceImage, this.config, this.config.output.directory);
        assets.push(...logoAssets);
        Logger.success(`Generated ${logoAssets.length} logo variants`);
      }

      if (shouldGenerateDefaults.platforms && this.config.platforms && this.config.platforms.length > 0) {
        Logger.progress('Generating platform-specific assets...');
        const platformAssets = await PlatformGenerator.generate(
          sourceImage, this.config, this.config.output.directory
        );
        assets.push(...platformAssets);
        Logger.success(`Generated ${platformAssets.length} platform-specific assets`);
      }

      for (const assetDef of this.config.assets) {
        if (this.shouldGenerateCustomAsset(sourceImage, assetDef)) {
          Logger.progress(`Generating custom assets for ${assetDef.name}...`);
          const customAssets = await this.generateCustomAssets(sourceImage, assetDef);
          assets.push(...customAssets);
          Logger.success(`Generated ${customAssets.length} custom assets for ${assetDef.name}`);
        }
      }

    } catch (error) {
      Logger.error(`Failed to process source image ${sourceImage.path}`, error as Error);
      throw error;
    }

    return assets;
  }

  private async generateCustomAssets(
    sourceImage: SourceImage, 
    assetDef: { name: string; variants: unknown[]; outputPath?: string; type?: string }
  ): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];

    let outputPath: string;
    if (assetDef.outputPath) {
      if (path.isAbsolute(assetDef.outputPath)) {
        outputPath = assetDef.outputPath;
      } else {
        outputPath = path.join(this.config.output.directory, assetDef.outputPath);
      }
    } else {
      outputPath = path.join(
        this.config.output.directory, 
        this.config.output.structure[assetDef.type as keyof typeof this.config.output.structure] || ''
      );
    }

    for (const variant of assetDef.variants) {
      try {
        const variantObj = variant as Record<string, unknown>;
        const fullOutputPath = path.join(outputPath, `${variantObj.name}.${variantObj.format}`);

        const { ImageProcessor } = await import('../processors/image-processor');
        const asset = await ImageProcessor.processImage(
          sourceImage, 
          variantObj as unknown as AssetVariant, 
          fullOutputPath, 
          {
          quality: (variantObj.quality as number) || 
            this.config.processing.quality[variantObj.format as keyof typeof this.config.processing.quality],
          background: variantObj.background as string | undefined,
          margin: variantObj.margin as MarginConfig | undefined,
          theme: variantObj.theme as ThemeVariant | undefined,
          overwriteMode: (variantObj as Record<string, unknown>).overwrite as OverwriteMode || this.overwriteMode,
        },
        this.config);

        assets.push(asset);
      } catch (error) {
        const variantObj = variant as Record<string, unknown>;
        Logger.error(`Failed to generate asset ${variantObj.name}`, error as Error);
      }
    }

    return assets;
  }

  private simulateAssetGeneration(): GeneratedAsset[] {
    const assets: GeneratedAsset[] = [];

    for (const assetDef of this.config.assets) {
      for (const variant of assetDef.variants) {
        const variantObj = variant as unknown as Record<string, unknown>;
        
        const width = (variantObj.width as number) || 32;
        const height = (variantObj.height as number) || 32;
        const format = variantObj.format as string;
        
        let estimatedSize = width * height;
        if (format === 'jpeg') estimatedSize *= 0.3;
        else if (format === 'webp') estimatedSize *= 0.25;
        else if (format === 'avif') estimatedSize *= 0.2;
        else if (format === 'ico') estimatedSize *= 1.5;
        else estimatedSize *= 0.8;
        
        assets.push({
          name: variantObj.name as string,
          path: `/simulated/${variantObj.name}.${format}`,
          format: format as OutputFormat,
          width,
          height,
          fileSize: Math.round(estimatedSize),
          optimised: true,
        });
      }
    }

    return assets;
  }

  private calculateMetrics(assets: GeneratedAsset[], startTime: number): ProcessingMetrics {
    const totalFileSize = assets.reduce((sum, asset) => sum + asset.fileSize, 0);

    return {
      totalAssets: assets.length,
      successfulAssets: assets.length,
      failedAssets: 0,
      totalFileSize,
      processingTime: Date.now() - startTime,
    };
  }

  async generateManifestFiles(): Promise<void> {
    if (this.dryRun) {
      Logger.info('Dry run mode - skipping manifest file generation');
      return;
    }

    const faviconAssets = this.getAssetsByType();
    const socialAssets = this.getAssetsByType();

    if (faviconAssets.length > 0) {
      const webmanifest = FaviconGenerator.generateWebmanifest(faviconAssets);
      const webmanifestPath = path.join(this.config.output.directory, 'site.webmanifest');
      await FileUtils.writeTextFile(webmanifestPath, webmanifest);
      Logger.success('Generated site.webmanifest');

      const browserConfig = FaviconGenerator.generateBrowserConfigXml(faviconAssets);
      const browserConfigPath = path.join(this.config.output.directory, 'browserconfig.xml');
      await FileUtils.writeTextFile(browserConfigPath, browserConfig);
      Logger.success('Generated browserconfig.xml');

      const htmlTags = FaviconGenerator.generateHtmlTags(faviconAssets);
      const htmlTagsPath = path.join(this.config.output.directory, 'favicon-tags.html');
      await FileUtils.writeTextFile(htmlTagsPath, htmlTags.join('\n'));
      Logger.success('Generated favicon-tags.html');
    }

    if (socialAssets.length > 0) {
      const metaTags = SocialGenerator.generateMetaTags(socialAssets);
      const metaTagsPath = path.join(this.config.output.directory, 'social-meta-tags.html');
      await FileUtils.writeTextFile(metaTagsPath, metaTags.join('\n'));
      Logger.success('Generated social-meta-tags.html');
    }
  }

  private shouldGenerateDefaultAssets(sourceImage: SourceImage): {
    favicon: boolean;
    social: boolean;
    logos: boolean;
    platforms: boolean;
  } {
    const defaults = this.config.source.defaults || {
      favicon: true,
      social: true,
      logos: true,
      platforms: true,
    };

    
    const hasCustomFavicon = this.config.assets.some(
      asset => asset.type === 'favicon' && this.shouldGenerateCustomAsset(sourceImage, asset)
    );
    const hasCustomSocial = this.config.assets.some(
      asset => asset.type === 'social' && this.shouldGenerateCustomAsset(sourceImage, asset)
    );
    const hasCustomLogos = this.config.assets.some(
      asset => asset.type === 'logo' && this.shouldGenerateCustomAsset(sourceImage, asset)
    );
    const hasCustomPlatforms = this.config.assets.some(
      asset => asset.type === 'platform-specific' && this.shouldGenerateCustomAsset(sourceImage, asset)
    );

    return {
      favicon: defaults.favicon !== false && !hasCustomFavicon,
      social: defaults.social !== false && !hasCustomSocial,
      logos: defaults.logos !== false && !hasCustomLogos,
      platforms: defaults.platforms !== false && !hasCustomPlatforms,
    };
  }

  private shouldGenerateCustomAsset(sourceImage: SourceImage, assetDef: AssetDefinition): boolean {
    if (!assetDef.source) {
      return true;
    }

    const sourceImageName = path.basename(sourceImage.path);
    const assetSourceName = path.basename(assetDef.source);
    
    return sourceImageName === assetSourceName || sourceImage.path === assetDef.source;
  }

  private getAssetsByType(): GeneratedAsset[] {
    return [];
  }
}
