import path from 'path';
import { ImageProcessor } from '../processors/image-processor';
import { SourceImage, GeneratedAsset, AssetVariant, PipelineConfig } from '../types';

export class FaviconGenerator {
  static async generate(
    sourceImage: SourceImage, 
    config: PipelineConfig, 
    outputDir: string
  ): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];
    const faviconDir = path.join(outputDir, config.output.structure.favicon);

    const faviconVariants: AssetVariant[] = [
      { name: 'favicon-16x16', width: 16, height: 16, format: 'png' },
      { name: 'favicon-32x32', width: 32, height: 32, format: 'png' },
      { name: 'apple-touch-icon', width: 180, height: 180, format: 'png' },
      { name: 'android-chrome-192x192', width: 192, height: 192, format: 'png' },
      { name: 'android-chrome-512x512', width: 512, height: 512, format: 'png' },
      { name: 'mstile-150x150', width: 150, height: 150, format: 'png' },
    ];

    for (const variant of faviconVariants) {
      const outputPath = path.join(faviconDir, `${variant.name}.${variant.format}`);
      const asset = await ImageProcessor.processImage(sourceImage, variant, outputPath, {
        quality: config.processing.quality.png,
        overwriteMode: variant.overwrite || config.output.overwrite,
      }, config);
      assets.push(asset);
    }

    const faviconIcoPath = path.join(faviconDir, 'favicon.ico');
    const icoAssets = await ImageProcessor.generateFavicon(sourceImage, faviconIcoPath, config.output.overwrite);
    assets.push(...icoAssets);

    return assets;
  }

  static generateWebmanifest(assets: GeneratedAsset[], baseUrl: string = ''): string {
    const icons = assets
      .filter(asset => asset.name.includes('android-chrome'))
      .map(asset => ({
        src: `${baseUrl}/${path.basename(asset.path)}`,
        sizes: `${asset.width}x${asset.height}`,
        type: `image/${asset.format}`,
      }));

    const manifest = {
      name: 'Web App',
      short_name: 'App',
      icons,
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
    };

    return JSON.stringify(manifest, null, 2);
  }

  static generateBrowserConfigXml(assets: GeneratedAsset[], baseUrl: string = ''): string {
    const mstile = assets.find(asset => asset.name.includes('mstile'));
    const tileImage = mstile ? `${baseUrl}/${path.basename(mstile.path)}` : '';

    return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="${tileImage}"/>
            <TileColor>#ffffff</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;
  }

  static generateHtmlTags(assets: GeneratedAsset[], baseUrl: string = ''): string[] {
    const tags: string[] = [];

    const favicon16 = assets.find(asset => asset.name === 'favicon-16x16');
    const favicon32 = assets.find(asset => asset.name === 'favicon-32x32');
    const appleTouchIcon = assets.find(asset => asset.name === 'apple-touch-icon');

    if (favicon16) {
      tags.push(`<link rel="icon" type="image/png" sizes="16x16" href="${baseUrl}/${path.basename(favicon16.path)}">`);
    }

    if (favicon32) {
      tags.push(`<link rel="icon" type="image/png" sizes="32x32" href="${baseUrl}/${path.basename(favicon32.path)}">`);
    }

    if (appleTouchIcon) {
      tags.push(
        `<link rel="apple-touch-icon" sizes="180x180" href="${baseUrl}/${path.basename(appleTouchIcon.path)}">`
      );
    }

    tags.push(`<link rel="manifest" href="${baseUrl}/site.webmanifest">`);
    tags.push(`<meta name="msapplication-config" content="${baseUrl}/browserconfig.xml">`);

    return tags;
  }
}
