import path from 'path';
import { ImageProcessor } from '../processors/image-processor';
import { SourceImage, GeneratedAsset, AssetVariant, PipelineConfig } from '../types';

export class SocialGenerator {
  static async generate(
    sourceImage: SourceImage, 
    config: PipelineConfig, 
    outputDir: string
  ): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];
    const socialDir = path.join(outputDir, config.output.structure.social);

    const socialVariants: AssetVariant[] = [
      {
        name: 'og-image',
        width: 1200,
        height: 630,
        format: 'png',
        margin: { all: '10%' },
        background: '#ffffff'
      },
      {
        name: 'twitter-card',
        width: 1200,
        height: 600,
        format: 'png',
        margin: { all: '10%' },
        background: '#ffffff'
      },
      {
        name: 'linkedin-share',
        width: 1200,
        height: 627,
        format: 'png',
        margin: { all: '10%' },
        background: '#ffffff'
      },
      {
        name: 'facebook-share',
        width: 1200,
        height: 630,
        format: 'png',
        margin: { all: '10%' },
        background: '#ffffff'
      },
    ];

    for (const variant of socialVariants) {
      const outputPath = path.join(socialDir, `${variant.name}.${variant.format}`);
      const asset = await ImageProcessor.processImage(sourceImage, variant, outputPath, {
        quality: config.processing.quality.png,
        background: variant.background,
        margin: variant.margin,
        overwriteMode: variant.overwrite || config.output.overwrite,
      }, config);
      assets.push(asset);
    }

    return assets;
  }

  static generateMetaTags(assets: GeneratedAsset[], baseUrl: string = '', siteTitle: string = 'Website'): string[] {
    const tags: string[] = [];

    const ogImage = assets.find(asset => asset.name === 'og-image');
    const twitterCard = assets.find(asset => asset.name === 'twitter-card');

    if (ogImage) {
      tags.push(`<meta property="og:image" content="${baseUrl}/${path.basename(ogImage.path)}">`);
      tags.push(`<meta property="og:image:width" content="${ogImage.width}">`);
      tags.push(`<meta property="og:image:height" content="${ogImage.height}">`);
      tags.push(`<meta property="og:image:type" content="image/${ogImage.format}">`);
    }

    if (twitterCard) {
      tags.push(`<meta name="twitter:card" content="summary_large_image">`);
      tags.push(`<meta name="twitter:image" content="${baseUrl}/${path.basename(twitterCard.path)}">`);
    }

    tags.push(`<meta property="og:title" content="${siteTitle}">`);
    tags.push(`<meta name="twitter:title" content="${siteTitle}">`);

    return tags;
  }

  static generateStructuredData(
    assets: GeneratedAsset[], 
    baseUrl: string = '', 
    organisation: Record<string, unknown> = {}
  ): string {
    const ogImage = assets.find(asset => asset.name === 'og-image');

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: organisation.name || 'Organization',
      url: organisation.url || baseUrl,
      logo: ogImage ? `${baseUrl}/${path.basename(ogImage.path)}` : undefined,
      image: ogImage ? `${baseUrl}/${path.basename(ogImage.path)}` : undefined,
      description: organisation.description || '',
    };

    return JSON.stringify(structuredData, null, 2);
  }
}
