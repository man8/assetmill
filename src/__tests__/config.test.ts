import { ConfigLoader } from '../config/loader';
import { mergeWithDefaults } from '../config/schema';
import { PipelineConfig } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('ConfigLoader', () => {
  const testConfigDir = path.join(__dirname, 'fixtures');
  const testConfigPath = path.join(testConfigDir, 'test-config.yml');

  beforeAll(async () => {
    await fs.ensureDir(testConfigDir);
    const testConfig = `
source:
  images:
    - logo.svg
  formats:
    - svg
    - png
  validation:
    minWidth: 512
    minHeight: 512
    maxFileSize: 52428800
    requireTransparency: true

output:
  directory: ./test-assets
  formats:
    - png
    - webp

assets:
  - name: test-favicon
    type: favicon
    variants:
      - name: favicon-16x16
        width: 16
        height: 16
        format: png
`;
    await fs.writeFile(testConfigPath, testConfig);
  });

  afterAll(async () => {
    await fs.remove(testConfigDir);
  });

  describe('load', () => {
    it('should load and validate configuration from YAML file', async () => {
      const config = await ConfigLoader.load(testConfigPath);

      expect(config.source.images).toContain(path.resolve(testConfigDir, 'logo.svg'));
      expect(path.isAbsolute(config.output.directory)).toBe(true);
      expect(config.output.directory).toBe(path.resolve(process.cwd(), 'test-assets'));
      expect(config.assets).toHaveLength(1);
      expect(config.assets[0].name).toBe('test-favicon');
    });

    it('should throw error for non-existent config file', async () => {
      await expect(ConfigLoader.load('non-existent.yml')).rejects.toThrow();
    });

    it('should resolve relative paths relative to config file directory', async () => {
      const config = await ConfigLoader.load(testConfigPath);
      
      expect(path.isAbsolute(config.output.directory)).toBe(true);
      expect(config.output.directory).toBe(path.resolve(process.cwd(), 'test-assets'));
      
      config.source.images.forEach(imagePath => {
        expect(path.isAbsolute(imagePath)).toBe(true);
      });
    });

    it('should preserve absolute paths in configuration', async () => {
      const absoluteConfigPath = path.join(testConfigDir, 'absolute-paths.yml');
      const absoluteOutputDir = path.join(__dirname, 'absolute-output');
      const absoluteImagePath = path.join(__dirname, 'absolute-logo.svg');
      
      const testConfig = `
source:
  images:
    - ${absoluteImagePath}
  formats:
    - svg
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
    type: favicon
    variants:
      - name: favicon-16x16
        width: 16
        height: 16
        format: png
`;
      
      await fs.writeFile(absoluteConfigPath, testConfig);
      
      try {
        const config = await ConfigLoader.load(absoluteConfigPath);
        
        expect(config.output.directory).toBe(absoluteOutputDir);
        expect(config.source.images[0]).toBe(absoluteImagePath);
      } finally {
        await fs.remove(absoluteConfigPath);
      }
    });

    it('should resolve relative output directory relative to working directory', async () => {
      const relativeConfigPath = path.join(testConfigDir, 'relative-paths.yml');
      const relativeOutputDir = '../relative-output';
      const relativeImagePath = '../relative-logo.svg';
      
      const testConfig = `
source:
  images:
    - ${relativeImagePath}
  formats:
    - svg
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
    type: favicon
    outputPath: ./
    variants:
      - name: favicon-16x16
        width: 16
        height: 16
        format: png
`;
      
      await fs.writeFile(relativeConfigPath, testConfig);
      
      try {
        const originalCwd = process.cwd();
        const differentCwd = path.join(__dirname, 'different-cwd');
        await fs.ensureDir(differentCwd);
        
        try {
          process.chdir(differentCwd);
          
          const config = await ConfigLoader.load(relativeConfigPath);
          
          expect(path.isAbsolute(config.output.directory)).toBe(true);
          expect(config.output.directory).toBe(path.resolve(process.cwd(), relativeOutputDir));
          expect(path.isAbsolute(config.source.images[0])).toBe(true);
          expect(config.source.images[0]).toBe(path.resolve(testConfigDir, relativeImagePath));
        } finally {
          process.chdir(originalCwd);
          await fs.remove(differentCwd);
        }
      } finally {
        await fs.remove(relativeConfigPath);
      }
    });
  });

  describe('generateTemplate', () => {
    it('should generate a valid configuration template', async () => {
      const templatePath = path.join(testConfigDir, 'template.yml');
      await ConfigLoader.generateTemplate(templatePath);

      const exists = await fs.pathExists(templatePath);
      expect(exists).toBe(true);

      const config = await ConfigLoader.load(templatePath);
      expect(config.source.images).toBeDefined();
      expect(config.output.directory).toBeDefined();
      expect(config.assets).toBeDefined();
    });
  });

  describe('findConfigFile', () => {
    it('should find config file in current directory', () => {
      const configPath = ConfigLoader.findConfigFile(testConfigDir);
      expect(configPath).toBeTruthy();
      if (configPath) {
        expect(configPath).toContain('test-config.yml');
      }
    });

    it('should find assetmill.yml config file', async () => {
      const assetmillConfigPath = path.join(testConfigDir, 'assetmill.yml');
      const testConfig = `
source:
  images:
    - logo.svg
  formats:
    - svg
    - png
  validation:
    minWidth: 512
    minHeight: 512
    maxFileSize: 52428800
    requireTransparency: true

output:
  directory: ./test-assets
  formats:
    - png
    - webp

assets:
  - name: test-favicon
    type: favicon
    variants:
      - name: favicon-16x16
        width: 16
        height: 16
        format: png
`;
      
      await fs.writeFile(assetmillConfigPath, testConfig);
      
      try {
        const configPath = ConfigLoader.findConfigFile(testConfigDir);
        expect(configPath).toBeTruthy();
        if (configPath) {
          expect(configPath).toMatch(/assetmill\.yml|test-config\.yml/);
        }
      } finally {
        await fs.remove(assetmillConfigPath);
      }
    });

    it('should return null when no config file found', () => {
      const configPath = ConfigLoader.findConfigFile('/tmp');
      expect(configPath).toBeNull();
    });
  });
});

describe('Configuration validation', () => {
  describe('schema validation via ConfigLoader', () => {
    it('should validate correct configuration', async () => {
      const tempConfigPath = path.join(__dirname, 'temp-valid-config.yml');
      const yamlContent = `
source:
  images:
    - logo.svg
  formats:
    - svg
    - png
  validation:
    minWidth: 512
    minHeight: 512
    maxFileSize: 52428800
    requireTransparency: true
output:
  directory: ./assets
  structure:
    favicon: public/favicon
    social: assets/social
    logos: images/logos
    platforms: assets/platforms
  naming:
    template: '{name}-{width}x{height}.{format}'
    variables: {}
  formats:
    - png
    - webp
  overwrite: error
assets:
  - name: test-asset
    type: favicon
    variants:
      - name: test-variant
        format: png
processing:
  quality:
    png: 90
    jpeg: 85
    webp: 80
    avif: 75
    svg: 100
  optimisation:
    progressive: true
    optimise: true
    lossless: false
  themes:
    light:
      enabled: true
      colorTransforms: []
    dark:
      enabled: false
      colorTransforms: []
    monochrome:
      enabled: false
      colorTransforms: []
  contrast:
    enabled: false
    threshold: 0.3
    strokeWidth: 1
    strokeColor: '#ffffff'
`;
      
      await fs.writeFile(tempConfigPath, yamlContent);
      
      try {
        const loadedConfig = await ConfigLoader.load(tempConfigPath);
        expect(loadedConfig.source.images).toBeDefined();
        expect(loadedConfig.output.directory).toBeDefined();
        expect(loadedConfig.assets).toBeDefined();
      } finally {
        await fs.remove(tempConfigPath);
      }
    });
  });

  describe('mergeWithDefaults', () => {
    it('should merge partial config with defaults', () => {
      const partialConfig: Partial<PipelineConfig> = {
        source: {
          images: ['custom-logo.svg'],
          formats: ['svg'],
          validation: {
            minWidth: 256,
            minHeight: 256,
            maxFileSize: 10485760,
            requireTransparency: false,
          },
        },
      };

      const merged = mergeWithDefaults(partialConfig);

      expect(merged.source.images).toEqual(['custom-logo.svg']);
      expect(merged.output.directory).toBe('./assets');
      expect(merged.processing.quality.png).toBe(90);
    });
  });
});
