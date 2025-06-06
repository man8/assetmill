import { AssetPipeline } from '../pipeline/asset-pipeline';
import { PipelineConfig, SourceImage } from '../types';

describe('AssetPipeline source assignment', () => {
  const mockSourceImages: SourceImage[] = [
    { path: '/test/icon.svg', format: 'svg', width: 100, height: 100 },
    { path: '/test/logo.svg', format: 'svg', width: 200, height: 100 },
  ];

  const createTestConfig = (overrides: Partial<PipelineConfig> = {}): PipelineConfig => ({
    source: {
      images: ['/test/icon.svg', '/test/logo.svg'],
      formats: ['svg'],
      validation: { minWidth: 512, minHeight: 512, maxFileSize: 52428800, requireTransparency: false },
      defaults: { favicon: false, social: false, logos: false, platforms: false },
    },
    output: {
      directory: './test-output',
      structure: {
        favicon: 'favicon',
        social: 'social',
        logos: 'logos',
        platforms: 'platforms',
      },
      naming: {
        template: '{name}.{format}',
        variables: {},
      },
      formats: ['png'],
    },
    assets: [],
    processing: {
      quality: { png: 90, jpeg: 85, webp: 80, avif: 75 },
      optimisation: { progressive: true, optimise: true, lossless: false },
      themes: {
        light: { enabled: true, colorTransforms: [] },
        dark: { enabled: false, colorTransforms: [] },
        monochrome: { enabled: false, colorTransforms: [] },
      },
      contrast: {
        enabled: false,
        threshold: 0.3,
        strokeWidth: 1,
        strokeColor: '#ffffff',
      },
    },
    platforms: [],
    ...overrides,
  });

  it('should respect source assignments and skip default generation', () => {
    const config = createTestConfig({
      assets: [
        {
          name: 'favicon-only',
          type: 'favicon',
          source: 'icon.svg',
          variants: [{ name: 'favicon-16x16', width: 16, height: 16, format: 'png' }],
        },
      ],
    });

    const pipeline = new AssetPipeline(config, true);
    
    type PipelineWithPrivateMethods = {
      shouldGenerateDefaultAssets: (img: SourceImage) => {
        favicon: boolean;
        social: boolean;
        logos: boolean;
        platforms: boolean;
      };
    };
    
    const iconDefaults = (pipeline as unknown as PipelineWithPrivateMethods)
      .shouldGenerateDefaultAssets(mockSourceImages[0]);
    const logoDefaults = (pipeline as unknown as PipelineWithPrivateMethods)
      .shouldGenerateDefaultAssets(mockSourceImages[1]);
    
    expect(iconDefaults.favicon).toBe(false);
    expect(iconDefaults.social).toBe(false);
    expect(logoDefaults.favicon).toBe(false);
    expect(logoDefaults.social).toBe(false);
  });

  it('should generate defaults when no custom assets exist and defaults are enabled', () => {
    const config = createTestConfig({
      source: {
        images: ['/test/icon.svg', '/test/logo.svg'],
        formats: ['svg'],
        validation: { minWidth: 512, minHeight: 512, maxFileSize: 52428800, requireTransparency: false },
        defaults: { favicon: true, social: true, logos: true, platforms: true },
      },
      assets: [],
    });

    const pipeline = new AssetPipeline(config, true);
    
    type PipelineWithPrivateMethods = {
      shouldGenerateDefaultAssets: (img: SourceImage) => {
        favicon: boolean;
        social: boolean;
        logos: boolean;
        platforms: boolean;
      };
    };
    
    const iconDefaults = (pipeline as unknown as PipelineWithPrivateMethods)
      .shouldGenerateDefaultAssets(mockSourceImages[0]);
    
    expect(iconDefaults.favicon).toBe(true);
    expect(iconDefaults.social).toBe(true);
    expect(iconDefaults.logos).toBe(true);
    expect(iconDefaults.platforms).toBe(true);
  });

  it('should correctly identify when to generate custom assets based on source', () => {
    const config = createTestConfig({
      assets: [
        {
          name: 'favicon-only',
          type: 'favicon',
          source: 'icon.svg',
          variants: [{ name: 'favicon-16x16', width: 16, height: 16, format: 'png' }],
        },
      ],
    });

    const pipeline = new AssetPipeline(config, true);
    
    type PipelineWithCustomAssetMethod = {
      shouldGenerateCustomAsset: (img: SourceImage, asset: unknown) => boolean;
    };
    
    const shouldGenerateForIcon = (pipeline as unknown as PipelineWithCustomAssetMethod)
      .shouldGenerateCustomAsset(mockSourceImages[0], config.assets[0]);
    const shouldGenerateForLogo = (pipeline as unknown as PipelineWithCustomAssetMethod)
      .shouldGenerateCustomAsset(mockSourceImages[1], config.assets[0]);
    
    expect(shouldGenerateForIcon).toBe(true);
    expect(shouldGenerateForLogo).toBe(false);
  });

  it('should generate custom assets for all sources when no source is specified', () => {
    const config = createTestConfig({
      assets: [
        {
          name: 'universal-asset',
          type: 'logo',
          variants: [{ name: 'logo-32', width: 32, height: 32, format: 'png' }],
        },
      ],
    });

    const pipeline = new AssetPipeline(config, true);
    
    type PipelineWithCustomAssetMethod = {
      shouldGenerateCustomAsset: (img: SourceImage, asset: unknown) => boolean;
    };
    
    const shouldGenerateForIcon = (pipeline as unknown as PipelineWithCustomAssetMethod)
      .shouldGenerateCustomAsset(mockSourceImages[0], config.assets[0]);
    const shouldGenerateForLogo = (pipeline as unknown as PipelineWithCustomAssetMethod)
      .shouldGenerateCustomAsset(mockSourceImages[1], config.assets[0]);
    
    expect(shouldGenerateForIcon).toBe(true);
    expect(shouldGenerateForLogo).toBe(true);
  });
});
