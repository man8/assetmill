import path from 'path';
import { ImageProcessor } from '../processors/image-processor';
import { SourceImage, GeneratedAsset, AssetVariant, PipelineConfig, ThemeVariant } from '../types';

export class LogoGenerator {
  static async generate(
    sourceImage: SourceImage, 
    config: PipelineConfig, 
    outputDir: string
  ): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];
    const logosDir = path.join(outputDir, config.output.structure.logos);

    const standardSizes = [24, 32, 48, 64, 128, 256];
    const headerSizes = [120, 150, 200];

    for (const size of standardSizes) {
      const variants = await this.generateSizeVariants(sourceImage, size, size, logosDir, config);
      assets.push(...variants);
    }

    for (const width of headerSizes) {
      const variants = await this.generateSizeVariants(sourceImage, width, undefined, logosDir, config);
      assets.push(...variants);
    }

    return assets;
  }

  private static async generateSizeVariants(
    sourceImage: SourceImage,
    width: number,
    height: number | undefined,
    outputDir: string,
    config: PipelineConfig
  ): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];
    const baseName = height ? `logo-${width}x${height}` : `logo-${width}w`;

    const themes: ThemeVariant[] = [];
    if (config.processing.themes.light.enabled) themes.push('light');
    if (config.processing.themes.dark.enabled) themes.push('dark');
    if (config.processing.themes.monochrome.enabled) themes.push('monochrome');

    for (const theme of themes) {
      for (const format of config.output.formats) {
        if (format === 'ico') continue;

        const variant: AssetVariant = {
          name: theme === 'light' ? baseName : `${baseName}-${theme}`,
          width,
          height,
          format,
          theme,
        };

        const outputPath = path.join(outputDir, `${variant.name}.${format}`);

        const asset = await ImageProcessor.processImage(sourceImage, variant, outputPath, {
          quality: config.processing.quality[format as keyof typeof config.processing.quality],
          theme,
          overwriteMode: variant.overwrite || config.output.overwrite,
        }, config);

        assets.push(asset);
      }
    }

    return assets;
  }

  static generateCssVariables(assets: GeneratedAsset[], baseUrl: string = ''): string {
    const cssVars: string[] = [];

    const logosBySize = new Map<string, GeneratedAsset[]>();

    assets.forEach(asset => {
      const sizeKey = `${asset.width}x${asset.height}`;
      if (!logosBySize.has(sizeKey)) {
        logosBySize.set(sizeKey, []);
      }
      logosBySize.get(sizeKey)!.push(asset);
    });

    logosBySize.forEach((sizeAssets, size) => {
      const lightLogo = sizeAssets.find(a => !a.name.includes('-dark') && !a.name.includes('-monochrome'));
      const darkLogo = sizeAssets.find(a => a.name.includes('-dark'));

      if (lightLogo) {
        cssVars.push(`  --logo-${size}: url('${baseUrl}/${path.basename(lightLogo.path)}');`);
      }
      if (darkLogo) {
        cssVars.push(`  --logo-${size}-dark: url('${baseUrl}/${path.basename(darkLogo.path)}');`);
      }
    });

    return `:root {\n${cssVars.join('\n')}\n}`;
  }
}
