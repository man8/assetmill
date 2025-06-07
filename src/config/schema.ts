import { PipelineConfig, AssetType, OutputFormat, OverwriteMode } from '../types';

export const DEFAULT_CONFIG: PipelineConfig = {
  source: {
    images: ['icon.svg', 'logo-colour-black.svg', 'logo-colour-white.svg'],
    formats: ['svg', 'png', 'jpeg'],
    validation: {
      minWidth: 512,
      minHeight: 512,
      maxFileSize: 50 * 1024 * 1024,
      requireTransparency: true,
    },
    defaults: {
      favicon: false,
      social: false,
      logos: false,
      platforms: false,
    },
  },
  output: {
    directory: './assets',
    structure: {
      favicon: 'public/favicon',
      social: 'assets/social',
      logos: 'images/logos',
      platforms: 'assets/platforms',
    },
    naming: {
      template: '{name}-{width}x{height}.{format}',
      variables: {},
    },
    formats: ['png', 'webp', 'jpeg', 'svg'],
    overwrite: 'error' as OverwriteMode,
  },
  assets: [
    {
      name: 'favicon-suite',
      type: 'favicon' as AssetType,
      source: 'icon.svg',
      variants: [
        { name: 'favicon-16x16', width: 16, height: 16, format: 'png' as OutputFormat },
        { name: 'favicon-32x32', width: 32, height: 32, format: 'png' as OutputFormat },
        { name: 'apple-touch-icon', width: 180, height: 180, format: 'png' as OutputFormat },
        { name: 'android-chrome-192x192', width: 192, height: 192, format: 'png' as OutputFormat },
        { name: 'android-chrome-512x512', width: 512, height: 512, format: 'png' as OutputFormat },
        { name: 'mstile-150x150', width: 150, height: 150, format: 'png' as OutputFormat },
      ],
    },
    {
      name: 'social-media',
      type: 'social' as AssetType,
      source: 'logo-colour-black.svg',
      variants: [
        { name: 'og-image', width: 1200, height: 630, format: 'png' as OutputFormat },
        { name: 'twitter-card', width: 1200, height: 600, format: 'png' as OutputFormat },
        { name: 'linkedin-share', width: 1200, height: 627, format: 'png' as OutputFormat },
      ],
    },
    {
      name: 'logo-variants',
      type: 'logo' as AssetType,
      variants: [
        { name: 'logo-24', width: 24, height: 24, format: 'png' as OutputFormat },
        { name: 'logo-32', width: 32, height: 32, format: 'png' as OutputFormat },
        { name: 'logo-48', width: 48, height: 48, format: 'png' as OutputFormat },
        { name: 'logo-64', width: 64, height: 64, format: 'png' as OutputFormat },
        { name: 'logo-128', width: 128, height: 128, format: 'png' as OutputFormat },
        { name: 'logo-256', width: 256, height: 256, format: 'png' as OutputFormat },
      ],
    },
  ],
  processing: {
    quality: {
      png: 90,
      jpeg: 85,
      webp: 80,
      avif: 75,
      svg: 100,
    },
    optimisation: {
      progressive: true,
      optimise: true,
      lossless: false,
    },
    themes: {
      light: {
        enabled: true,
        colorTransforms: [],
      },
      dark: {
        enabled: true,
        colorTransforms: [
          { from: '#000000', to: '#ffffff' },
          { from: '#333333', to: '#cccccc' },
        ],
      },
      monochrome: {
        enabled: true,
        color: '#000000',
        threshold: 128,
      },
    },
    contrast: {
      enabled: true,
      threshold: 0.3,
      strokeWidth: 1,
      strokeColor: '#ffffff',
    },
  },
};

export function validateConfig(config: Partial<PipelineConfig>): string[] {
  const errors: string[] = [];

  if (!config.source?.images || config.source.images.length === 0) {
    errors.push('Source images must be specified');
  }

  if (!config.output?.directory) {
    errors.push('Output directory must be specified');
  }

  if (!config.assets || config.assets.length === 0) {
    errors.push('At least one asset definition must be provided');
  }

  config.assets?.forEach((asset, index) => {
    if (!asset.name) {
      errors.push(`Asset ${index} must have a name`);
    }
    if (!asset.variants || asset.variants.length === 0) {
      errors.push(`Asset ${asset.name} must have at least one variant`);
    }
    if (asset.source && !config.source?.images.some(img => 
      img === asset.source || img.endsWith(asset.source as string))) {
      errors.push(`Asset ${asset.name} references unknown source image: ${asset.source}`);
    }
    asset.variants?.forEach((variant, variantIndex) => {
      if (!variant.name) {
        errors.push(`Variant ${variantIndex} of asset ${asset.name} must have a name`);
      }
      if (!variant.format) {
        errors.push(`Variant ${variant.name} must specify a format`);
      }
    });
  });

  return errors;
}

export function mergeWithDefaults(config: Partial<PipelineConfig>): PipelineConfig {
  return {
    source: {
      ...DEFAULT_CONFIG.source,
      ...config.source,
    },
    output: {
      ...DEFAULT_CONFIG.output,
      ...config.output,
      structure: {
        ...DEFAULT_CONFIG.output.structure,
        ...config.output?.structure,
      },
      naming: {
        ...DEFAULT_CONFIG.output.naming,
        ...config.output?.naming,
      },
    },
    assets: config.assets || DEFAULT_CONFIG.assets,
    processing: {
      ...DEFAULT_CONFIG.processing,
      ...config.processing,
      quality: {
        ...DEFAULT_CONFIG.processing.quality,
        ...config.processing?.quality,
      },
      optimisation: {
        ...DEFAULT_CONFIG.processing.optimisation,
        ...config.processing?.optimisation,
      },
      themes: {
        ...DEFAULT_CONFIG.processing.themes,
        ...config.processing?.themes,
      },
      contrast: {
        ...DEFAULT_CONFIG.processing.contrast,
        ...config.processing?.contrast,
      },
    },
    platforms: config.platforms || [],
  };
}
