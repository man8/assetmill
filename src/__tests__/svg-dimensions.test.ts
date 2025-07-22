import { ImageProcessor } from '../processors/image-processor';
import { AssetVariant, SourceImage } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('SVG dimension handling', () => {
  let testDir: string;
  let testSvgPath: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), 'assetmill-svg-test');
    await fs.ensureDir(testDir);
    
    testSvgPath = path.join(testDir, 'test-icon.svg');
    const testSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="30" fill="blue"/>
</svg>`;
    await fs.writeFile(testSvgPath, testSvg);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should apply configured width and height to SVG output', async () => {
    const sourceImage: SourceImage = {
      path: testSvgPath,
      format: 'svg',
      width: 100,
      height: 100
    };
    
    const variant: AssetVariant = {
      name: 'test-svg',
      width: 267,
      height: 267,
      format: 'svg'
    };
    
    const outputPath = path.join(testDir, 'output.svg');
    
    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath);
    
    expect(result.width).toBe(267);
    expect(result.height).toBe(267);
    
    const outputContent = await fs.readFile(outputPath, 'utf-8');
    expect(outputContent).toMatch(/width="267"/);
    expect(outputContent).toMatch(/height="267"/);
  });

  it('should apply only width when height is not specified', async () => {
    const sourceImage: SourceImage = {
      path: testSvgPath,
      format: 'svg',
      width: 100,
      height: 100
    };
    
    const variant: AssetVariant = {
      name: 'test-svg-width-only',
      width: 414,
      format: 'svg'
    };
    
    const outputPath = path.join(testDir, 'output-width-only.svg');
    
    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath);
    
    expect(result.width).toBe(414);
    expect(result.height).toBe(100);
    
    const outputContent = await fs.readFile(outputPath, 'utf-8');
    expect(outputContent).toMatch(/width="414"/);
    expect(outputContent).not.toMatch(/height="414"/);
  });

  it('should apply only height when width is not specified', async () => {
    const sourceImage: SourceImage = {
      path: testSvgPath,
      format: 'svg',
      width: 100,
      height: 100
    };
    
    const variant: AssetVariant = {
      name: 'test-svg-height-only',
      height: 76,
      format: 'svg'
    };
    
    const outputPath = path.join(testDir, 'output-height-only.svg');
    
    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath);
    
    expect(result.width).toBe(100);
    expect(result.height).toBe(76);
    
    const outputContent = await fs.readFile(outputPath, 'utf-8');
    expect(outputContent).toMatch(/height="76"/);
    expect(outputContent).not.toMatch(/width="76"/);
  });

  it('should preserve preserveAspectRatio when applying dimensions', async () => {
    const sourceImage: SourceImage = {
      path: testSvgPath,
      format: 'svg',
      width: 100,
      height: 100
    };
    
    const variant: AssetVariant = {
      name: 'test-svg-preserve-aspect',
      width: 267,
      height: 267,
      format: 'svg',
      preserveAspectRatio: 'xMidYMid meet'
    };
    
    const outputPath = path.join(testDir, 'output-preserve-aspect.svg');
    
    await ImageProcessor.processImage(sourceImage, variant, outputPath);
    
    const outputContent = await fs.readFile(outputPath, 'utf-8');
    expect(outputContent).toMatch(/width="267"/);
    expect(outputContent).toMatch(/height="267"/);
    expect(outputContent).toMatch(/preserveAspectRatio="xMidYMid meet"/);
  });

  it('should not apply dimensions when not specified in variant', async () => {
    const sourceImage: SourceImage = {
      path: testSvgPath,
      format: 'svg',
      width: 100,
      height: 100
    };
    
    const variant: AssetVariant = {
      name: 'test-svg-no-dimensions',
      format: 'svg'
    };
    
    const outputPath = path.join(testDir, 'output-no-dimensions.svg');
    
    const result = await ImageProcessor.processImage(sourceImage, variant, outputPath);
    
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    
    const outputContent = await fs.readFile(outputPath, 'utf-8');
    expect(outputContent).toMatch(/width="100"/);
    expect(outputContent).toMatch(/height="100"/);
  });

  it('should not incorrectly match stroke-width attributes when checking for width', () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
      '<circle stroke-width="5" cx="50" cy="50" r="30"/></svg>';
    const variant: AssetVariant = {
      name: 'test',
      format: 'svg',
      width: 200,
      height: 200
    };

    const result = ImageProcessor['applySvgAttributes'](svgContent, ImageProcessor['parseSvgConfig'](variant));

    expect(result).toContain('width="200"');
    expect(result).toContain('height="200"');
    expect(result).toContain('stroke-width="5"');
  });

  it('should prioritise variant dimensions over svg config dimensions', () => {
    const variant: AssetVariant = {
      name: 'test',
      format: 'svg',
      width: 300,
      height: 400,
      svg: {
        monochrome: '#ff0000',
        simplified: true
      }
    };

    const config = ImageProcessor['parseSvgConfig'](variant);
    
    expect(config.width).toBe(300);
    expect(config.height).toBe(400);
    expect(config.monochrome).toBe('#ff0000');
    expect(config.simplified).toBe(true);
  });

  it('should handle multiple stroke-width attributes without false positives', () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
      '<rect stroke-width="2" x="10" y="10"/><circle stroke-width="3" cx="50" cy="50"/></svg>';
    const variant: AssetVariant = {
      name: 'test',
      format: 'svg',
      width: 500
    };

    const result = ImageProcessor['applySvgAttributes'](svgContent, ImageProcessor['parseSvgConfig'](variant));

    expect(result).toContain('width="500"');
    expect(result).toContain('stroke-width="2"');
    expect(result).toContain('stroke-width="3"');
    expect(result).toMatch(/<svg[^>]*width="500"/);
    expect(result.match(/stroke-width="/g)).toHaveLength(2);
  });
});
