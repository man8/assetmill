import { ConfigLoader } from '../config/loader';
import { AssetPipeline } from '../pipeline/asset-pipeline';
import { OutputFormat } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('Output Directory Path Resolution', () => {
  const testDir = path.join(__dirname, 'output-test-fixtures');
  const configDir = path.join(testDir, 'config');
  const outputDir = path.join(testDir, 'output');
  
  beforeAll(async () => {
    await fs.ensureDir(configDir);
    await fs.ensureDir(outputDir);
  });

  afterAll(async () => {
    await fs.remove(testDir);
  });

  describe('ConfigLoader path resolution', () => {
    it('should resolve relative output directory relative to working directory', async () => {
      const configPath = path.join(configDir, 'relative-config.yml');
      const relativeOutputDir = '../output';
      
      const testConfig = `
source:
  images:
    - test-icon.svg
  formats:
    - png
  validation:
    minWidth: 512
    minHeight: 512
    maxFileSize: 52428800
    requireTransparency: true

output:
  directory: ${relativeOutputDir}
  formats:
    - png

assets:
  - name: test-favicon
    outputPath: ./
    variants:
      - name: favicon-16x16
        width: 16
        height: 16
        format: png
`;

      await fs.writeFile(configPath, testConfig);
      
      try {
        const config = await ConfigLoader.load(configPath);
        
        expect(path.isAbsolute(config.output.directory)).toBe(true);
        expect(config.output.directory).toBe(path.resolve(process.cwd(), relativeOutputDir));
      } finally {
        await fs.remove(configPath);
      }
    });

    it('should preserve absolute output directory paths', async () => {
      const configPath = path.join(configDir, 'absolute-config.yml');
      const absoluteOutputDir = path.join(__dirname, 'absolute-output');
      
      const testConfig = `
source:
  images:
    - test-icon.svg
  formats:
    - png
  validation:
    minWidth: 512
    minHeight: 512
    maxFileSize: 52428800
    requireTransparency: true

output:
  directory: ${absoluteOutputDir}
  formats:
    - png

assets:
  - name: test-favicon
    outputPath: ./
    variants:
      - name: favicon-16x16
        width: 16
        height: 16
        format: png
`;

      await fs.writeFile(configPath, testConfig);
      
      try {
        const config = await ConfigLoader.load(configPath);
        
        expect(config.output.directory).toBe(absoluteOutputDir);
      } finally {
        await fs.remove(configPath);
      }
    });
  });

  describe('AssetPipeline outputPath resolution', () => {
    it('should resolve relative asset outputPath relative to main output directory', () => {
      const mockConfig = {
        output: {
          directory: '/test/output',
          formats: ['png' as OutputFormat],
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
        assets: [],
        processing: { 
          quality: { png: 95, jpeg: 90, webp: 85, avif: 80, svg: 100 },
          optimisation: {
            progressive: true,
            optimise: true,
            lossless: false
          },
          themes: {
            light: { enabled: true, colorTransforms: [] },
            dark: { enabled: false, colorTransforms: [] },
            monochrome: { enabled: false, colorTransforms: [] }
          },
          contrast: {
            enabled: false,
            threshold: 0.5,
            strokeWidth: 1,
            strokeColor: '#000000'
          }
        }
      };

      expect(path.join(mockConfig.output.directory, './subfolder')).toBe('/test/output/subfolder');
      expect('/absolute/path').toBe('/absolute/path');
    });
  });

  describe('End-to-end path resolution', () => {
    it('should work correctly when running from different working directory', async () => {
      const configPath = path.join(configDir, 'e2e-config.yml');
      const iconPath = path.join(configDir, 'test-icon.svg');
      const relativeOutputDir = '../output';
      
      const testConfig = `
source:
  images:
    - test-icon.svg
  formats:
    - svg
    - png
  validation:
    minWidth: 512
    minHeight: 512
    maxFileSize: 52428800
    requireTransparency: true

output:
  directory: ${relativeOutputDir}
  formats:
    - png

assets:
  - name: favicon-suite
    source: test-icon.svg
    outputPath: ./
    variants:
      - name: favicon-16x16
        width: 16
        height: 16
        format: png

  - name: logo-suite
    source: test-icon.svg
    outputPath: images/
    variants:
      - name: logo
        height: 120
        format: png

  - name: custom-suite
    source: test-icon.svg
    outputPath: custom/images/
    variants:
      - name: custom-logo
        height: 120
        format: png
`;

      const testIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="blue"/>
</svg>`;

      await fs.writeFile(configPath, testConfig);
      await fs.writeFile(iconPath, testIcon);
      
      try {
        const originalCwd = process.cwd();
        const differentCwd = path.join(testDir, 'different-cwd');
        await fs.ensureDir(differentCwd);
        
        try {
          process.chdir(differentCwd);
          
          const config = await ConfigLoader.load(configPath);
          const pipeline = new AssetPipeline(config, true);
          
          expect(path.isAbsolute(config.output.directory)).toBe(true);
          expect(config.output.directory).toBe(path.resolve(process.cwd(), relativeOutputDir));
          
          const result = await pipeline.execute();
          expect(result.success).toBe(true);
          
        } finally {
          process.chdir(originalCwd);
          await fs.remove(differentCwd);
        }
      } finally {
        await fs.remove(configPath);
        await fs.remove(iconPath);
      }
    });

    it('should resolve output paths relative to working directory for branding config scenario', async () => {
      const brandingDir = path.join(testDir, 'branding');
      const configPath = path.join(brandingDir, 'config.yml');
      const expectedOutputDir = path.join(process.cwd(), 'storage-app/resources/public');
      
      await fs.ensureDir(brandingDir);
      
      const testConfig = `
source:
  images:
    - icon.svg
  formats:
    - svg
  validation:
    minWidth: 512
    minHeight: 512
    maxFileSize: 52428800
    requireTransparency: true

output:
  directory: storage-app/resources/public
  formats:
    - png

assets:
  - name: test-favicon
    outputPath: ./
    variants:
      - name: favicon-16x16
        width: 16
        height: 16
        format: png
`;

      await fs.writeFile(configPath, testConfig);
      
      try {
        const config = await ConfigLoader.load(configPath);
        
        expect(path.isAbsolute(config.output.directory)).toBe(true);
        expect(config.output.directory).toBe(expectedOutputDir);
      } finally {
        await fs.remove(configPath);
        await fs.remove(brandingDir);
      }
    });
  });
});
