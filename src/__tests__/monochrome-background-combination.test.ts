import { ImageProcessor } from '../processors/image-processor';
import { SourceImage, AssetVariant } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import sharp from 'sharp';

describe('Monochrome + Background combination functionality', () => {
  const testDir = path.join(__dirname, 'monochrome-background-test-fixtures');
  const testImagePath = path.join(testDir, 'test-colored-logo.svg');

  beforeAll(async () => {
    await fs.ensureDir(testDir);

    const testSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="none"/>
  <circle cx="256" cy="256" r="150" fill="#4a90e2"/>
  <rect x="206" y="206" width="100" height="100" fill="#ff6b35"/>
</svg>`;

    await fs.writeFile(testImagePath, testSvg);
  });

  afterAll(async () => {
    await fs.remove(testDir);
  });

  it('should produce white logo on orange background when combining monochrome and background', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 512,
      height: 512
    };

    const variant: AssetVariant = {
      name: 'test-monochrome-with-background',
      width: 200,
      height: 200,
      format: 'png',
      monochrome: '#ffffff',
      background: '#FA680E'
    };

    const outputPath = path.join(testDir, 'test-monochrome-with-background.png');

    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {});

    expect(result.width).toBe(200);
    expect(result.height).toBe(200);
    expect(result.format).toBe('png');

    const imageBuffer = await fs.readFile(outputPath);
    const { data, info } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });

    expect(info.channels).toBeGreaterThanOrEqual(3);

    const pixelCount = info.width * info.height;
    const channels = info.channels;

    let hasOrangeBackground = false;
    let hasWhiteContent = false;

    for (let i = 0; i < pixelCount * channels; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = channels === 4 ? data[i + 3] : 255;

      if (Math.abs(r - 250) <= 5 && Math.abs(g - 104) <= 5 && Math.abs(b - 14) <= 5 && a === 255) {
        hasOrangeBackground = true;
      }

      if (r === 255 && g === 255 && b === 255 && a === 255) {
        hasWhiteContent = true;
      }
    }

    expect(hasOrangeBackground).toBe(true);
    expect(hasWhiteContent).toBe(true);

    await fs.remove(outputPath);
  });

  it('should work correctly with ICO format combining monochrome and background', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 512,
      height: 512
    };

    const variant: AssetVariant = {
      name: 'test-ico-monochrome-with-background',
      width: 32,
      height: 32,
      format: 'ico',
      monochrome: '#ffffff',
      background: '#0066cc'
    };

    const outputPath = path.join(testDir, 'test-ico-monochrome-with-background.ico');

    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {});

    expect(result.width).toBe(32);
    expect(result.height).toBe(32);
    expect(result.format).toBe('ico');

    const stats = await fs.stat(outputPath);
    expect(stats.size).toBeGreaterThan(0);

    await fs.remove(outputPath);
  });

  it('should handle monochrome black with colored background', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 512,
      height: 512
    };

    const variant: AssetVariant = {
      name: 'test-black-monochrome-with-background',
      width: 100,
      height: 100,
      format: 'png',
      monochrome: '#000000',
      background: '#ffff00'
    };

    const outputPath = path.join(testDir, 'test-black-monochrome-with-background.png');

    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {});

    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.format).toBe('png');

    const imageBuffer = await fs.readFile(outputPath);
    const { data, info } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });

    const pixelCount = info.width * info.height;
    const channels = info.channels;

    let hasYellowBackground = false;
    let hasBlackContent = false;

    for (let i = 0; i < pixelCount * channels; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = channels === 4 ? data[i + 3] : 255;

      if (r === 255 && g === 255 && b === 0 && a === 255) {
        hasYellowBackground = true;
      }

      if (r === 0 && g === 0 && b === 0 && a === 255) {
        hasBlackContent = true;
      }
    }

    expect(hasYellowBackground).toBe(true);
    expect(hasBlackContent).toBe(true);

    await fs.remove(outputPath);
  });
});
