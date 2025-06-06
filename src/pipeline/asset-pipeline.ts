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
  AssetDefinition 
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

  constructor(config: PipelineConfig, dryRun: boolean = false) {
    this.config = config;
    this.dryRun = dryRun;
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
      Logger.info('Dry run mode - simulating asset generation');
      return this.simulateAssetGeneration(sourceImage);
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

  private simulateAssetGeneration(sourceImage: SourceImage): GeneratedAsset[] {
    const assets: GeneratedAsset[] = [];
    const shouldGenerateDefaults = this.shouldGenerateDefaultAssets(sourceImage);

    if (shouldGenerateDefaults.favicon) {
      Logger.progress('Simulating favicon assets...');
      const faviconAssets = this.simulateFaviconGeneration();
      assets.push(...faviconAssets);
      Logger.success(`Would generate ${faviconAssets.length} favicon assets`);
    }

    if (shouldGenerateDefaults.social) {
      Logger.progress('Simulating social media assets...');
      const socialAssets = this.simulateSocialGeneration();
      assets.push(...socialAssets);
      Logger.success(`Would generate ${socialAssets.length} social media assets`);
    }

    if (shouldGenerateDefaults.logos) {
      Logger.progress('Simulating logo variants...');
      const logoAssets = this.simulateLogoGeneration();
      assets.push(...logoAssets);
      Logger.success(`Would generate ${logoAssets.length} logo variants`);
    }

    if (shouldGenerateDefaults.platforms && this.config.platforms && this.config.platforms.length > 0) {
      Logger.progress('Simulating platform-specific assets...');
      const platformAssets = this.simulatePlatformGeneration();
      assets.push(...platformAssets);
      Logger.success(`Would generate ${platformAssets.length} platform-specific assets`);
    }

    for (const assetDef of this.config.assets) {
      if (this.shouldGenerateCustomAsset(sourceImage, assetDef)) {
        Logger.progress(`Simulating custom assets for ${assetDef.name}...`);
        const customAssets = this.simulateCustomAssets(assetDef);
        assets.push(...customAssets);
        Logger.success(`Would generate ${customAssets.length} custom assets for ${assetDef.name}`);
      }
    }

    return assets;
  }

  private simulateFaviconGeneration(): GeneratedAsset[] {
    const assets: GeneratedAsset[] = [];
    const faviconDir = path.join(this.config.output.directory, this.config.output.structure.favicon);

    const faviconVariants = [
      { name: 'favicon-16x16', width: 16, height: 16, format: 'png' as const },
      { name: 'favicon-32x32', width: 32, height: 32, format: 'png' as const },
      { name: 'apple-touch-icon', width: 180, height: 180, format: 'png' as const },
      { name: 'android-chrome-192x192', width: 192, height: 192, format: 'png' as const },
      { name: 'android-chrome-512x512', width: 512, height: 512, format: 'png' as const },
      { name: 'mstile-150x150', width: 150, height: 150, format: 'png' as const },
    ];

    faviconVariants.forEach(variant => {
      assets.push({
        name: variant.name,
        path: path.join(faviconDir, `${variant.name}.${variant.format}`),
        format: variant.format,
        width: variant.width,
        height: variant.height,
        fileSize: variant.width * variant.height * 4,
        optimised: true,
      });
    });

    assets.push({
      name: 'favicon',
      path: path.join(faviconDir, 'favicon.ico'),
      format: 'ico' as const,
      width: 32,
      height: 32,
      fileSize: 15086,
      optimised: true,
    });

    return assets;
  }

  private simulateSocialGeneration(): GeneratedAsset[] {
    const assets: GeneratedAsset[] = [];
    const socialDir = path.join(this.config.output.directory, this.config.output.structure.social);

    const socialVariants = [
      { name: 'og-image', width: 1200, height: 630, format: 'png' as const },
      { name: 'twitter-card', width: 1200, height: 600, format: 'png' as const },
      { name: 'linkedin-share', width: 1200, height: 627, format: 'png' as const },
      { name: 'facebook-share', width: 1200, height: 630, format: 'png' as const },
    ];

    socialVariants.forEach(variant => {
      assets.push({
        name: variant.name,
        path: path.join(socialDir, `${variant.name}.${variant.format}`),
        format: variant.format,
        width: variant.width,
        height: variant.height,
        fileSize: variant.width * variant.height * 3,
        optimised: true,
      });
    });

    return assets;
  }

  private simulateLogoGeneration(): GeneratedAsset[] {
    const assets: GeneratedAsset[] = [];
    const logosDir = path.join(this.config.output.directory, this.config.output.structure.logos);

    const standardSizes = [24, 32, 48, 64, 128, 256];
    const headerSizes = [120, 150, 200];

    const themes: string[] = [];
    if (this.config.processing.themes.light.enabled) themes.push('light');
    if (this.config.processing.themes.dark.enabled) themes.push('dark');
    if (this.config.processing.themes.monochrome.enabled) themes.push('monochrome');

    for (const size of standardSizes) {
      for (const theme of themes) {
        for (const format of this.config.output.formats) {
          if (format === 'ico') continue;

          const baseName = `logo-${size}x${size}`;
          const name = theme === 'light' ? baseName : `${baseName}-${theme}`;

          assets.push({
            name,
            path: path.join(logosDir, `${name}.${format}`),
            format,
            width: size,
            height: size,
            fileSize: size * size * 3,
            optimised: true,
          });
        }
      }
    }

    for (const width of headerSizes) {
      for (const theme of themes) {
        for (const format of this.config.output.formats) {
          if (format === 'ico') continue;

          const baseName = `logo-${width}w`;
          const name = theme === 'light' ? baseName : `${baseName}-${theme}`;

          assets.push({
            name,
            path: path.join(logosDir, `${name}.${format}`),
            format,
            width,
            height: Math.round(width * 0.6),
            fileSize: width * Math.round(width * 0.6) * 3,
            optimised: true,
          });
        }
      }
    }

    return assets;
  }

  private simulatePlatformGeneration(): GeneratedAsset[] {
    const assets: GeneratedAsset[] = [];
    const platformsDir = path.join(this.config.output.directory, this.config.output.structure.platforms);

    if (!this.config.platforms) return assets;

    for (const platform of this.config.platforms) {
      if (platform.assets) {
        for (const platformAsset of platform.assets) {
          if (platformAsset.variants) {
            for (const variant of platformAsset.variants) {
              const variantObj = variant as unknown as Record<string, unknown>;
              assets.push({
                name: variantObj.name as string,
                path: path.join(platformsDir, `${variantObj.name}.${variantObj.format}`),
                format: variantObj.format as 'png' | 'jpeg' | 'webp' | 'avif' | 'ico',
                width: variantObj.width as number,
                height: variantObj.height as number,
                fileSize: (variantObj.width as number) * (variantObj.height as number) * 3,
                optimised: true,
              });
            }
          }
        }
      }
    }

    return assets;
  }

  private simulateCustomAssets(
    assetDef: { name: string; variants: unknown[]; outputPath?: string; type?: string }
  ): GeneratedAsset[] {
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
      const variantObj = variant as Record<string, unknown>;
      assets.push({
        name: variantObj.name as string,
        path: path.join(outputPath, `${variantObj.name}.${variantObj.format}`),
        format: variantObj.format as 'png' | 'jpeg' | 'webp' | 'avif' | 'ico',
        width: variantObj.width as number,
        height: variantObj.height as number,
        fileSize: (variantObj.width as number) * (variantObj.height as number) * 3,
        optimised: true,
      });
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
