import { ImageProcessor } from '../processors/image-processor';
import { SourceImage, AssetVariant } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('ICO configurable sizes functionality', () => {
  const testDir = path.join(__dirname, 'ico-sizes-test-fixtures');
  const testImagePath = path.join(testDir, 'test-icon.svg');
  
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

  it('should generate ICO with custom sizes array', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 100,
      height: 100
    };

    const variant: AssetVariant = {
      name: 'test-custom-sizes',
      format: 'ico',
      sizes: [16, 32, 48, 64]
    };

    const outputPath = path.join(testDir, 'test-custom-sizes.ico');
    
    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {});
    
    expect(result.format).toBe('ico');
    expect(result.width).toBe(64);
    expect(result.height).toBe(64);
    
    const stats = await fs.stat(outputPath);
    expect(stats.size).toBeGreaterThan(1000);
    
    await fs.remove(outputPath);
  });

  it('should generate ICO with monochrome theme and custom sizes', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 100,
      height: 100
    };

    const variant: AssetVariant = {
      name: 'test-monochrome-ico',
      format: 'ico',
      sizes: [16, 32],
      monochrome: '#ffffff'
    };

    const outputPath = path.join(testDir, 'test-monochrome-ico.ico');
    
    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {});
    
    expect(result.format).toBe('ico');
    expect(result.width).toBe(32);
    expect(result.height).toBe(32);
    
    await fs.remove(outputPath);
  });

  it('should use standard sizes when no custom sizes provided', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 100,
      height: 100
    };

    const variant: AssetVariant = {
      name: 'test-standard-sizes',
      format: 'ico',
      width: 32,
      height: 32
    };

    const outputPath = path.join(testDir, 'test-standard-sizes.ico');
    
    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath, {});
    
    expect(result.format).toBe('ico');
    expect(result.width).toBe(32);
    expect(result.height).toBe(32);
    
    await fs.remove(outputPath);
  });
});
