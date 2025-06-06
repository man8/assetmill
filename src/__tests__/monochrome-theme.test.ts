import { ImageProcessor } from '../processors/image-processor';
import { SourceImage, AssetVariant } from '../types';
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
  <defs>
    <linearGradient id="testGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6b35;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffd700;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#testGradient)"/>
  <circle cx="256" cy="256" r="200" fill="#4a90e2"/>
</svg>`;

    await fs.writeFile(testImagePath, testSvg);
  });

  afterAll(async () => {
    await fs.remove(testDir);
  });

  it('should apply black monochrome theme with new syntax', async () => {
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
      monochrome: '#000000'
    };

    const outputPath = path.join(testDir, 'test-black-monochrome.png');

    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {});

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

  it('should apply white monochrome theme with new syntax', async () => {
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
      monochrome: '#ffffff'
    };

    const outputPath = path.join(testDir, 'test-white-monochrome.png');

    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {});

    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.format).toBe('png');

    const imageBuffer = await fs.readFile(outputPath);
    const { data, info } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });

    expect(info.channels).toBeGreaterThanOrEqual(3);

    const pixelCount = info.width * info.height;
    const channels = info.channels;

    let hasWhitePixels = false;
    for (let i = 0; i < pixelCount * channels; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = channels === 4 ? data[i + 3] : 255;

      if (a > 0 && r === 255 && g === 255 && b === 255) {
        hasWhitePixels = true;
        break;
      }
    }

    expect(hasWhitePixels).toBe(true);

    await fs.remove(outputPath);
  });

  it('should support configurable threshold in monochrome config', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 512,
      height: 512
    };

    const variant: AssetVariant = {
      name: 'test-threshold-monochrome',
      width: 100,
      height: 100,
      format: 'png',
      monochrome: { color: '#ffffff', threshold: 64 }
    };

    const outputPath = path.join(testDir, 'test-threshold-monochrome.png');

    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {});

    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.format).toBe('png');

    const imageBuffer = await fs.readFile(outputPath);
    const { data, info } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });

    expect(info.channels).toBeGreaterThanOrEqual(3);

    const pixelCount = info.width * info.height;
    const channels = info.channels;

    let hasWhitePixels = false;
    for (let i = 0; i < pixelCount * channels; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = channels === 4 ? data[i + 3] : 255;

      if (a > 0 && r === 255 && g === 255 && b === 255) {
        hasWhitePixels = true;
        break;
      }
    }

    expect(hasWhitePixels).toBe(true);

    await fs.remove(outputPath);
  });

  it('should convert gradient SVG to white monochrome using new syntax', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 512,
      height: 512
    };

    const variant: AssetVariant = {
      name: 'test-gradient-white-monochrome',
      width: 100,
      height: 100,
      format: 'png',
      monochrome: '#ffffff'
    };

    const outputPath = path.join(testDir, 'test-gradient-white-monochrome.png');

    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {});

    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.format).toBe('png');

    const imageBuffer = await fs.readFile(outputPath);
    const { data, info } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });

    expect(info.channels).toBeGreaterThanOrEqual(3);

    const pixelCount = info.width * info.height;
    const channels = info.channels;

    let hasOnlyWhiteAndTransparent = true;
    for (let i = 0; i < pixelCount * channels; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = channels === 4 ? data[i + 3] : 255;

      if (a > 0 && (r !== 255 || g !== 255 || b !== 255)) {
        hasOnlyWhiteAndTransparent = false;
        break;
      }
    }

    expect(hasOnlyWhiteAndTransparent).toBe(true);

    await fs.remove(outputPath);
  });

  it('should support custom color monochrome with threshold', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 512,
      height: 512
    };

    const variant: AssetVariant = {
      name: 'test-custom-color-monochrome',
      width: 100,
      height: 100,
      format: 'png',
      monochrome: { color: '#ff0000', threshold: 100 }
    };

    const outputPath = path.join(testDir, 'test-custom-color-monochrome.png');

    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {});

    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.format).toBe('png');

    await fs.remove(outputPath);
  });
});
