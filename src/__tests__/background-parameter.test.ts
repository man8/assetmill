import { ImageProcessor } from '../processors/image-processor';
import { SourceImage, AssetVariant } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import sharp from 'sharp';

describe('Background parameter functionality', () => {
  const testDir = path.join(__dirname, 'background-test-fixtures');
  const testImagePath = path.join(testDir, 'test-transparent-icon.svg');
  
  beforeAll(async () => {
    await fs.ensureDir(testDir);
    
    const testSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="30" fill="black"/>
</svg>`;
    
    await fs.writeFile(testImagePath, testSvg);
  });

  afterAll(async () => {
    await fs.remove(testDir);
  });

  it('should apply white background to PNG with hex color', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 100,
      height: 100
    };

    const variant: AssetVariant = {
      name: 'test-white-background',
      width: 100,
      height: 100,
      format: 'png',
      background: '#ffffff'
    };

    const outputPath = path.join(testDir, 'test-white-background.png');
    
    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {});
    
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.format).toBe('png');
    
    const imageBuffer = await fs.readFile(outputPath);
    const imageStats = await sharp(imageBuffer).stats();
    
    expect(imageStats.isOpaque).toBe(true);
    
    const { data, info } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });
    const pixelCount = info.width * info.height;
    const channels = info.channels;
    
    let hasWhiteBackground = false;
    for (let i = 0; i < pixelCount * channels; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = channels === 4 ? data[i + 3] : 255;
      
      if (r === 255 && g === 255 && b === 255 && a === 255) {
        hasWhiteBackground = true;
        break;
      }
    }
    
    expect(hasWhiteBackground).toBe(true);
    
    await fs.remove(outputPath);
  });

  it('should apply red background to PNG with hex color', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 100,
      height: 100
    };

    const variant: AssetVariant = {
      name: 'test-red-background',
      width: 100,
      height: 100,
      format: 'png',
      background: '#ff0000'
    };

    const outputPath = path.join(testDir, 'test-red-background.png');
    
    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {});
    
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.format).toBe('png');
    
    const imageBuffer = await fs.readFile(outputPath);
    const imageStats = await sharp(imageBuffer).stats();
    
    expect(imageStats.isOpaque).toBe(true);
    
    const { data, info } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });
    const pixelCount = info.width * info.height;
    const channels = info.channels;
    
    let hasRedBackground = false;
    for (let i = 0; i < pixelCount * channels; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = channels === 4 ? data[i + 3] : 255;
      
      if (r === 255 && g === 0 && b === 0 && a === 255) {
        hasRedBackground = true;
        break;
      }
    }
    
    expect(hasRedBackground).toBe(true);
    
    await fs.remove(outputPath);
  });

  it('should handle 3-digit hex colors', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 100,
      height: 100
    };

    const variant: AssetVariant = {
      name: 'test-short-hex',
      width: 100,
      height: 100,
      format: 'png',
      background: '#fff'
    };

    const outputPath = path.join(testDir, 'test-short-hex.png');
    
    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {});
    
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.format).toBe('png');
    
    const imageBuffer = await fs.readFile(outputPath);
    const imageStats = await sharp(imageBuffer).stats();
    
    expect(imageStats.isOpaque).toBe(true);
    
    const { data, info } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });
    const pixelCount = info.width * info.height;
    const channels = info.channels;
    
    let hasWhiteBackground = false;
    for (let i = 0; i < pixelCount * channels; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = channels === 4 ? data[i + 3] : 255;
      
      if (r === 255 && g === 255 && b === 255 && a === 255) {
        hasWhiteBackground = true;
        break;
      }
    }
    
    expect(hasWhiteBackground).toBe(true);
    
    await fs.remove(outputPath);
  });

  it('should preserve transparency when no background specified', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 100,
      height: 100
    };

    const variant: AssetVariant = {
      name: 'test-no-background',
      width: 100,
      height: 100,
      format: 'png'
    };

    const outputPath = path.join(testDir, 'test-no-background.png');
    
    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {});
    
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.format).toBe('png');
    
    const imageBuffer = await fs.readFile(outputPath);
    const imageStats = await sharp(imageBuffer).stats();
    
    expect(imageStats.isOpaque).toBe(false);
    
    await fs.remove(outputPath);
  });
});
