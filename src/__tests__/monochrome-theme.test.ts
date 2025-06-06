import { ImageProcessor } from '../processors/image-processor';
import { SourceImage, AssetVariant, PipelineConfig } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import sharp from 'sharp';

describe('Monochrome theme functionality', () => {
  const testDir = path.join(__dirname, 'monochrome-test-fixtures');
  const testImagePath = path.join(testDir, 'test-colored-icon.svg');

  beforeAll(async () => {
    await fs.ensureDir(testDir);

    const testSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="red"/>
  <circle cx="256" cy="256" r="200" fill="green"/>
</svg>`;

    await fs.writeFile(testImagePath, testSvg);
  });

  afterAll(async () => {
    await fs.remove(testDir);
  });

  it('should generate black monochrome variant', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 512,
      height: 512
    };

    const variant: AssetVariant = {
      name: 'test-black-monochrome',
      width: 100,
      height: 100,
      format: 'png',
      theme: 'monochrome'
    };

    const config: PipelineConfig = {
      source: {
        images: [],
        formats: [],
        validation: {
          minWidth: 512,
          minHeight: 512,
          maxFileSize: 52428800,
          requireTransparency: true
        }
      },
      output: {
        directory: '/test/output',
        formats: ['png'],
        structure: {
          favicon: 'favicons',
          social: 'social',
          logos: 'logos',
          platforms: 'platforms'
        },
        naming: {
          template: '{name}',
          variables: {}
        }
      },
      assets: [],
      processing: {
        quality: { png: 90, jpeg: 85, webp: 80, avif: 75 },
        optimisation: { progressive: true, optimise: true, lossless: false },
        themes: {
          light: { enabled: true, colorTransforms: [] },
          dark: { enabled: false, colorTransforms: [] },
          monochrome: {
            enabled: true,
            colorTransforms: [
              { from: '#000000', to: '#000000' }
            ]
          }
        },
        contrast: { enabled: false, threshold: 0.5, strokeWidth: 1, strokeColor: '#000000' }
      }
    };

    const outputPath = path.join(testDir, 'test-black-monochrome.png');

    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {}, config);

    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.format).toBe('png');

    const imageBuffer = await fs.readFile(outputPath);
    const { data, info } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });

    expect(info.channels).toBeGreaterThanOrEqual(3);

    const pixelCount = info.width * info.height;
    const channels = info.channels;

    let isGreyscale = true;
    for (let i = 0; i < pixelCount * channels; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (r !== g || g !== b) {
        isGreyscale = false;
        break;
      }
    }

    expect(isGreyscale).toBe(true);

    await fs.remove(outputPath);
  });

  it('should generate white monochrome variant', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 512,
      height: 512
    };

    const variant: AssetVariant = {
      name: 'test-white-monochrome',
      width: 100,
      height: 100,
      format: 'png',
      theme: 'monochrome'
    };

    const config: PipelineConfig = {
      source: {
        images: [],
        formats: [],
        validation: {
          minWidth: 512,
          minHeight: 512,
          maxFileSize: 52428800,
          requireTransparency: true
        }
      },
      output: {
        directory: '/test/output',
        formats: ['png'],
        structure: {
          favicon: 'favicons',
          social: 'social',
          logos: 'logos',
          platforms: 'platforms'
        },
        naming: {
          template: '{name}',
          variables: {}
        }
      },
      assets: [],
      processing: {
        quality: { png: 90, jpeg: 85, webp: 80, avif: 75 },
        optimisation: { progressive: true, optimise: true, lossless: false },
        themes: {
          light: { enabled: true, colorTransforms: [] },
          dark: { enabled: false, colorTransforms: [] },
          monochrome: {
            enabled: true,
            colorTransforms: [
              { from: '#000000', to: '#ffffff' }
            ]
          }
        },
        contrast: { enabled: false, threshold: 0.5, strokeWidth: 1, strokeColor: '#000000' }
      }
    };

    const outputPath = path.join(testDir, 'test-white-monochrome.png');

    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {}, config);

    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.format).toBe('png');

    const imageBuffer = await fs.readFile(outputPath);
    const { data, info } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });

    expect(info.channels).toBeGreaterThanOrEqual(3);

    const pixelCount = info.width * info.height;
    const channels = info.channels;

    let isGreyscale = true;
    for (let i = 0; i < pixelCount * channels; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (r !== g || g !== b) {
        isGreyscale = false;
        break;
      }
    }

    expect(isGreyscale).toBe(true);

    await fs.remove(outputPath);
  });

  it('should handle monochrome theme without colorTransforms', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 512,
      height: 512
    };

    const variant: AssetVariant = {
      name: 'test-default-monochrome',
      width: 100,
      height: 100,
      format: 'png',
      theme: 'monochrome'
    };

    const config: PipelineConfig = {
      source: {
        images: [],
        formats: [],
        validation: {
          minWidth: 512,
          minHeight: 512,
          maxFileSize: 52428800,
          requireTransparency: true
        }
      },
      output: {
        directory: '/test/output',
        formats: ['png'],
        structure: {
          favicon: 'favicons',
          social: 'social',
          logos: 'logos',
          platforms: 'platforms'
        },
        naming: {
          template: '{name}',
          variables: {}
        }
      },
      assets: [],
      processing: {
        quality: { png: 90, jpeg: 85, webp: 80, avif: 75 },
        optimisation: { progressive: true, optimise: true, lossless: false },
        themes: {
          light: { enabled: true, colorTransforms: [] },
          dark: { enabled: false, colorTransforms: [] },
          monochrome: {
            enabled: true,
            colorTransforms: []
          }
        },
        contrast: { enabled: false, threshold: 0.5, strokeWidth: 1, strokeColor: '#000000' }
      }
    };

    const outputPath = path.join(testDir, 'test-default-monochrome.png');

    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {}, config);

    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.format).toBe('png');

    const imageBuffer = await fs.readFile(outputPath);
    const { data, info } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });

    expect(info.channels).toBeGreaterThanOrEqual(3);

    const pixelCount = info.width * info.height;
    const channels = info.channels;

    let isGreyscale = true;
    for (let i = 0; i < pixelCount * channels; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (r !== g || g !== b) {
        isGreyscale = false;
        break;
      }
    }

    expect(isGreyscale).toBe(true);

    await fs.remove(outputPath);
  });
});
