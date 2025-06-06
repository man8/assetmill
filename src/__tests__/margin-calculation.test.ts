import { ImageProcessor } from '../processors/image-processor';
import { SourceImage, AssetVariant } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('Margin calculation fix', () => {
  const testDir = path.join(__dirname, 'margin-test-fixtures');
  const testImagePath = path.join(testDir, 'test-icon.svg');
  
  beforeAll(async () => {
    await fs.ensureDir(testDir);
    
    const testSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="blue"/>
  <circle cx="256" cy="256" r="200" fill="white"/>
</svg>`;
    
    await fs.writeFile(testImagePath, testSvg);
  });

  afterAll(async () => {
    await fs.remove(testDir);
  });

  it('should include margins within requested dimensions', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 512,
      height: 512
    };

    const variant: AssetVariant = {
      name: 'test-with-margin',
      width: 100,
      height: 100,
      format: 'png',
      margin: { all: '10%' }
    };

    const outputPath = path.join(testDir, 'test-output.png');
    
    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath);
    
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    
    await fs.remove(outputPath);
  });

  it('should handle percentage margins correctly', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 512,
      height: 512
    };

    const variant: AssetVariant = {
      name: 'test-percentage-margin',
      width: 200,
      height: 200,
      format: 'png',
      margin: { all: '20%' }
    };

    const outputPath = path.join(testDir, 'test-percentage-output.png');
    
    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath);
    
    expect(result.width).toBe(200);
    expect(result.height).toBe(200);
    
    await fs.remove(outputPath);
  });

  it('should handle asymmetric margins correctly', async () => {
    const sourceImage: SourceImage = {
      path: testImagePath,
      format: 'svg',
      width: 512,
      height: 512
    };

    const variant: AssetVariant = {
      name: 'test-asymmetric-margin',
      width: 150,
      height: 150,
      format: 'png',
      margin: { 
        top: '10%',
        bottom: '10%',
        left: '5%',
        right: '5%'
      }
    };

    const outputPath = path.join(testDir, 'test-asymmetric-output.png');
    
    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath);
    
    expect(result.width).toBe(150);
    expect(result.height).toBe(150);
    
    await fs.remove(outputPath);
  });
});
