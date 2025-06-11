import { ConfigLoader } from '../config/loader';
import { ConfigurationNotFoundError, ConfigurationValidationError, YamlParsingError } from '../utils/errors';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('ConfigLoader Error Handling', () => {
  const testDir = path.join(__dirname, 'error-fixtures');
  
  beforeAll(async () => {
    await fs.ensureDir(testDir);
  });

  afterAll(async () => {
    await fs.remove(testDir);
  });

  describe('File existence errors', () => {
    it('should throw ConfigurationNotFoundError for non-existent file', async () => {
      const nonExistentPath = path.join(testDir, 'non-existent.yml');
      
      await expect(ConfigLoader.load(nonExistentPath))
        .rejects
        .toThrow(ConfigurationNotFoundError);
      
      try {
        await ConfigLoader.load(nonExistentPath);
      } catch (error: unknown) {
        expect((error as { filePath: string }).filePath).toBe(nonExistentPath);
        expect((error as Error).message).toContain('Configuration file not found');
      }
    });
  });

  describe('File permission errors', () => {
    it('should handle permission denied errors gracefully', async () => {
      const restrictedPath = path.join(testDir, 'restricted.yml');
      await fs.writeFile(restrictedPath, 'test: content');
      await fs.chmod(restrictedPath, 0o000);
      
      try {
        await expect(ConfigLoader.load(restrictedPath))
          .rejects
          .toThrow('Permission denied reading configuration file');
      } finally {
        await fs.chmod(restrictedPath, 0o644);
        await fs.remove(restrictedPath);
      }
    });
  });

  describe('YAML parsing errors', () => {
    it('should throw YamlParsingError with line information for malformed YAML', async () => {
      const malformedPath = path.join(testDir, 'malformed.yml');
      const malformedYaml = `
source:
  images:
    - logo.svg
  formats:
    - svg
  validation:
    minWidth: 512
    minHeight: 512
    maxFileSize: 52428800
    requireTransparency: true
output:
  directory: ./assets
  formats:
    - png
  overwrite: error
assets:
  - name: test
    type: favicon
    variants:
      - name: test-variant
        format: png
      - name: another-variant
        format: png
        invalid_yaml_syntax: [unclosed array
`;
      
      await fs.writeFile(malformedPath, malformedYaml);
      
      try {
        await expect(ConfigLoader.load(malformedPath))
          .rejects
          .toThrow(YamlParsingError);
        
        try {
          await ConfigLoader.load(malformedPath);
        } catch (error: unknown) {
          expect((error as { line?: number }).line).toBeDefined();
          if ((error as { column?: number }).column !== undefined) {
            expect((error as { column?: number }).column).toBeDefined();
          }
          expect((error as Error).message).toContain('YAML parsing error');
        }
      } finally {
        await fs.remove(malformedPath);
      }
    });
  });

  describe('Schema validation errors', () => {
    it('should throw ConfigurationValidationError for missing required fields', async () => {
      const invalidPath = path.join(testDir, 'invalid-schema.yml');
      const invalidConfig = `
source:
  images: []
  formats: []
output:
  formats:
    - png
  overwrite: error
assets: []
`;
      
      await fs.writeFile(invalidPath, invalidConfig);
      
      try {
        await expect(ConfigLoader.load(invalidPath))
          .rejects
          .toThrow(ConfigurationValidationError);
        
        try {
          await ConfigLoader.load(invalidPath);
        } catch (error: unknown) {
          expect((error as { errors: string[] }).errors).toBeDefined();
          expect((error as { errors: string[] }).errors.length).toBeGreaterThan(0);
          expect((error as Error).message).toContain('Configuration validation failed');
        }
      } finally {
        await fs.remove(invalidPath);
      }
    });

    it('should provide detailed field path information in validation errors', async () => {
      const invalidPath = path.join(testDir, 'invalid-fields.yml');
      const invalidConfig = `
source:
  images:
    - logo.svg
  formats:
    - invalid_format
  validation:
    minWidth: -1
    minHeight: 512
    maxFileSize: 52428800
    requireTransparency: true
output:
  directory: ./assets
  formats:
    - png
  overwrite: error
assets:
  - name: test
    type: favicon
    variants:
      - name: test-variant
        format: invalid_format
        quality: 150
`;
      
      await fs.writeFile(invalidPath, invalidConfig);
      
      try {
        await expect(ConfigLoader.load(invalidPath))
          .rejects
          .toThrow(ConfigurationValidationError);
        
        try {
          await ConfigLoader.load(invalidPath);
        } catch (error: unknown) {
          expect((error as { errors: string[] }).errors.some((err: string) => 
            err.includes('source.formats'))).toBe(true);
          expect((error as { errors: string[] }).errors.some((err: string) => err.includes('minWidth'))).toBe(true);
          expect((error as { errors: string[] }).errors.some((err: string) => err.includes('quality'))).toBe(true);
        }
      } finally {
        await fs.remove(invalidPath);
      }
    });

    it('should validate complete configuration structure', async () => {
      const validPath = path.join(testDir, 'valid-complete.yml');
      const validConfig = `
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
  defaults:
    favicon: true
    social: false
    logos: false
    platforms: false
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
    outputPath: ./
    source: logo.svg
    variants:
      - name: test-variant
        format: png
        width: 32
        height: 32
        quality: 90
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
      
      await fs.writeFile(validPath, validConfig);
      
      try {
        const config = await ConfigLoader.load(validPath);
        expect(config.source.images).toBeDefined();
        expect(config.output.directory).toBeDefined();
        expect(config.assets).toBeDefined();
        expect(config.processing).toBeDefined();
      } finally {
        await fs.remove(validPath);
      }
    });
  });
});
