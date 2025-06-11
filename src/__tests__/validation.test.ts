import { ValidationUtils } from '../utils/validation';
import { AssetVariant, PipelineConfig } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('ValidationUtils', () => {
  const testDir = path.join(__dirname, 'fixtures');
  const testImagePath = path.join(testDir, 'test-image.png');
  const svgPath = path.join(testDir, 'small-logo.svg');

  beforeAll(async () => {
    await fs.ensureDir(testDir);
    
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    await fs.writeFile(testImagePath, testImageBuffer);
    
    const svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" fill="red" />
      </svg>`;
    await fs.writeFile(svgPath, svgContent);
    
    const testImageExists = await fs.pathExists(testImagePath);
    const svgExists = await fs.pathExists(svgPath);
    if (!testImageExists || !svgExists) {
      throw new Error('Failed to create test fixture files');
    }
  });

  afterAll(async () => {
    await fs.remove(testDir);
  });
  describe('validateAssetVariant', () => {
    it('should validate correct asset variant', () => {
      const variant: AssetVariant = {
        name: 'test-variant',
        width: 256,
        height: 256,
        format: 'png',
        quality: 90,
      };

      const errors = ValidationUtils.validateAssetVariant(variant);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid asset variant', () => {
      const variant: AssetVariant = {
        name: '',
        width: -1,
        format: 'png',
        quality: 150,
      };

      const errors = ValidationUtils.validateAssetVariant(variant);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Asset variant must have a name');
      expect(errors).toContain('Width must be greater than 0');
      expect(errors).toContain('Quality must be between 1 and 100');
    });

    it('should reject SVG format with margin settings', () => {
      const variant: AssetVariant = {
        name: 'svg-with-margin',
        width: 100,
        height: 100,
        format: 'svg',
        margin: {
          all: '10%'
        }
      };

      const errors = ValidationUtils.validateAssetVariant(variant);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain(
        'Margin settings are not supported for SVG output format. ' +
        'SVG processing uses markup transformation rather than canvas manipulation. ' +
        'Use a raster format (PNG, JPEG, WebP, AVIF, ICO) if margins are required.'
      );
    });

    it('should reject SVG format with any margin property defined', () => {
      const variants = [
        { name: 'svg-top-margin', format: 'svg' as const, margin: { top: 10 } },
        { name: 'svg-horizontal-margin', format: 'svg' as const, margin: { horizontal: '5%' } },
        { name: 'svg-vertical-margin', format: 'svg' as const, margin: { vertical: 20 } },
        { name: 'svg-left-margin', format: 'svg' as const, margin: { left: 15 } },
      ];

      variants.forEach(variant => {
        const errors = ValidationUtils.validateAssetVariant(variant);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(error => 
          error.includes('Margin settings are not supported for SVG output format')
        )).toBe(true);
      });
    });

    it('should allow raster formats with margin settings', () => {
      const variants = [
        { name: 'png-with-margin', format: 'png' as const, margin: { all: '10%' } },
        { name: 'jpeg-with-margin', format: 'jpeg' as const, margin: { horizontal: 20 } },
        { name: 'webp-with-margin', format: 'webp' as const, margin: { top: 10, bottom: 10 } },
      ];

      variants.forEach(variant => {
        const errors = ValidationUtils.validateAssetVariant(variant);
        const hasMarginError = errors.some(error => error.includes('Margin settings are not supported'));
        expect(hasMarginError).toBe(false);
      });
    });

    it('should allow SVG format without margin settings', () => {
      const variant: AssetVariant = {
        name: 'svg-no-margin',
        width: 100,
        height: 100,
        format: 'svg'
      };

      const errors = ValidationUtils.validateAssetVariant(variant);
      const hasMarginError = errors.some(error => error.includes('Margin settings are not supported'));
      expect(hasMarginError).toBe(false);
    });
  });

  describe('isValidImageFormat', () => {
    it('should validate correct image formats', () => {
      expect(ValidationUtils.isValidImageFormat('svg')).toBe(true);
      expect(ValidationUtils.isValidImageFormat('png')).toBe(true);
      expect(ValidationUtils.isValidImageFormat('jpeg')).toBe(true);
      expect(ValidationUtils.isValidImageFormat('jpg')).toBe(true);
    });

    it('should reject invalid image formats', () => {
      expect(ValidationUtils.isValidImageFormat('gif')).toBe(false);
      expect(ValidationUtils.isValidImageFormat('bmp')).toBe(false);
      expect(ValidationUtils.isValidImageFormat('tiff')).toBe(false);
    });
  });

  describe('isValidOutputFormat', () => {
    it('should validate correct output formats', () => {
      expect(ValidationUtils.isValidOutputFormat('png')).toBe(true);
      expect(ValidationUtils.isValidOutputFormat('jpeg')).toBe(true);
      expect(ValidationUtils.isValidOutputFormat('webp')).toBe(true);
      expect(ValidationUtils.isValidOutputFormat('avif')).toBe(true);
      expect(ValidationUtils.isValidOutputFormat('ico')).toBe(true);
      expect(ValidationUtils.isValidOutputFormat('svg')).toBe(true);
    });

    it('should reject invalid output formats', () => {
      expect(ValidationUtils.isValidOutputFormat('gif')).toBe(false);
      expect(ValidationUtils.isValidOutputFormat('bmp')).toBe(false);
      expect(ValidationUtils.isValidOutputFormat('tiff')).toBe(false);
    });
  });

  describe('ICO format support', () => {
    it('should support ICO format in validation', () => {
      expect(ValidationUtils.isValidOutputFormat('ico')).toBe(true);
    });
  });

  describe('SVG validation', () => {
    it('should exempt SVG files from pixel dimension validation', async () => {
      const svgExists = await fs.pathExists(svgPath);
      expect(svgExists).toBe(true);

      const config: PipelineConfig = {
        source: {
          images: [svgPath],
          formats: ['svg'],
          validation: {
            minWidth: 512,
            minHeight: 512,
            maxFileSize: 52428800,
            requireTransparency: false,
          },
        },
        output: {
          directory: './test-output',
          structure: {
            favicon: 'favicon',
            social: 'social',
            logos: 'logos',
            platforms: 'platforms',
          },
          naming: {
            template: '{name}.{format}',
            variables: {},
          },
          formats: ['png'],
          overwrite: 'error',
        },
        assets: [],
        processing: {
          quality: { png: 90, jpeg: 85, webp: 80, avif: 75, svg: 100 },
          optimisation: { progressive: true, optimise: true, lossless: false },
          themes: {
            light: { enabled: true, colorTransforms: [] },
            dark: { enabled: false, colorTransforms: [] },
            monochrome: { enabled: false, colorTransforms: [] },
          },
          contrast: {
            enabled: false,
            threshold: 0.3,
            strokeWidth: 1,
            strokeColor: '#ffffff',
          },
        },
      };

      const validatedImages = await ValidationUtils.validateSourceImages(config);
      expect(validatedImages).toHaveLength(1);
      expect(validatedImages[0].format).toBe('svg');
      expect(validatedImages[0].path).toBe(svgPath);
    });

    it('should still validate non-SVG files for pixel dimensions', async () => {
      const config: PipelineConfig = {
        source: {
          images: [testImagePath],
          formats: ['png'],
          validation: {
            minWidth: 1000,
            minHeight: 1000,
            maxFileSize: 52428800,
            requireTransparency: false,
          },
        },
        output: {
          directory: './test-output',
          structure: {
            favicon: 'favicon',
            social: 'social',
            logos: 'logos',
            platforms: 'platforms',
          },
          naming: {
            template: '{name}.{format}',
            variables: {},
          },
          formats: ['png'],
          overwrite: 'error',
        },
        assets: [],
        processing: {
          quality: { png: 90, jpeg: 85, webp: 80, avif: 75, svg: 100 },
          optimisation: { progressive: true, optimise: true, lossless: false },
          themes: {
            light: { enabled: true },
            dark: { enabled: false },
            monochrome: { enabled: false, color: '#000000', threshold: 128 },
          },
          contrast: {
            enabled: false,
            threshold: 0.3,
            strokeWidth: 1,
            strokeColor: '#ffffff',
          },
        },
      };

      await expect(ValidationUtils.validateSourceImages(config)).rejects.toThrow(
        'smaller than minimum required size'
      );
    });
  });

  describe('Source assignment validation', () => {
    it('should validate asset definitions with valid source assignments', async () => {

      const tempConfigPath = path.join(testDir, 'temp-valid-source.yml');
      const yamlContent = `
source:
  images:
    - ${path.basename(svgPath)}
  formats:
    - svg
  validation:
    minWidth: 512
    minHeight: 512
    maxFileSize: 52428800
    requireTransparency: false
output:
  directory: ./test-output
  structure:
    favicon: favicon
    social: social
    logos: logos
    platforms: platforms
  naming:
    template: '{name}.{format}'
    variables: {}
  formats:
    - png
  overwrite: error
assets:
  - name: favicon-suite
    type: favicon
    source: ${path.basename(svgPath)}
    variants:
      - name: favicon-16x16
        width: 16
        height: 16
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
        const { ConfigLoader } = await import('../config/loader');
        const loadedConfig = await ConfigLoader.load(tempConfigPath);
        expect(loadedConfig.source.images).toBeDefined();
        expect(loadedConfig.assets).toBeDefined();
      } finally {
        await fs.remove(tempConfigPath);
      }
    });

    it('should reject asset definitions with invalid source assignments', async () => {

      const tempConfigPath = path.join(testDir, 'temp-invalid-source.yml');
      const yamlContent = `
source:
  images:
    - ${path.basename(svgPath)}
  formats:
    - svg
  validation:
    minWidth: 512
    minHeight: 512
    maxFileSize: 52428800
    requireTransparency: false
output:
  directory: ./test-output
  structure:
    favicon: favicon
    social: social
    logos: logos
    platforms: platforms
  naming:
    template: '{name}.{format}'
    variables: {}
  formats:
    - png
  overwrite: error
assets:
  - name: favicon-suite
    type: favicon
    source: nonexistent.svg
    variants:
      - name: favicon-16x16
        width: 16
        height: 16
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
        const { ConfigLoader } = await import('../config/loader');
        await expect(ConfigLoader.load(tempConfigPath)).rejects.toThrow();
      } finally {
        await fs.remove(tempConfigPath);
      }
    });
  });

  describe('validateDuplicateOutputPaths', () => {
    it('should detect duplicate output paths from different assets', () => {
      const config: Partial<PipelineConfig> = {
        output: { 
          directory: path.resolve(os.tmpdir(), 'test-output'),
          structure: {
            favicon: 'favicons',
            social: 'social',
            logos: 'logos',
            platforms: 'platforms'
          },
          naming: {
            template: '{name}',
            variables: {}
          },
          formats: ['png'],
          overwrite: 'error'
        },
        assets: [
          {
            name: 'asset1',
            type: 'logo',
            outputPath: './',
            variants: [{ name: 'logo', width: 100, height: 100, format: 'png' }]
          },
          {
            name: 'asset2',
            type: 'logo', 
            outputPath: './',
            variants: [{ name: 'logo', width: 100, height: 100, format: 'png' }]
          }
        ]
      };
      
      const errors = ValidationUtils.validateDuplicateOutputPaths(config as PipelineConfig);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Duplicate output file detected');
      expect(errors[0]).toContain('asset1.logo, asset2.logo');
    });

    it('should not report duplicates for different file names', () => {
      const config: Partial<PipelineConfig> = {
        output: { 
          directory: path.resolve(os.tmpdir(), 'test-output'),
          structure: {
            favicon: 'favicons',
            social: 'social',
            logos: 'logos',
            platforms: 'platforms'
          },
          naming: {
            template: '{name}',
            variables: {}
          },
          formats: ['png'],
          overwrite: 'error'
        },
        assets: [
          {
            name: 'asset1',
            type: 'logo',
            outputPath: './',
            variants: [{ name: 'logo1', width: 100, height: 100, format: 'png' }]
          },
          {
            name: 'asset2',
            type: 'logo',
            outputPath: './',
            variants: [{ name: 'logo2', width: 100, height: 100, format: 'png' }]
          }
        ]
      };
      
      const errors = ValidationUtils.validateDuplicateOutputPaths(config as PipelineConfig);
      expect(errors.length).toBe(0);
    });

    it('should detect duplicates across different output paths that resolve to same location', () => {
      const config: Partial<PipelineConfig> = {
        output: { 
          directory: path.resolve(os.tmpdir(), 'test-output'),
          structure: {
            favicon: 'favicons',
            social: 'social',
            logos: 'logos',
            platforms: 'platforms'
          },
          naming: {
            template: '{name}',
            variables: {}
          },
          formats: ['png'],
          overwrite: 'error'
        },
        assets: [
          {
            name: 'asset1',
            type: 'logo',
            outputPath: './images',
            variants: [{ name: 'logo', width: 100, height: 100, format: 'png' }]
          },
          {
            name: 'asset2',
            type: 'logo',
            outputPath: 'images/',
            variants: [{ name: 'logo', width: 100, height: 100, format: 'png' }]
          }
        ]
      };
      
      const errors = ValidationUtils.validateDuplicateOutputPaths(config as PipelineConfig);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Duplicate output file detected');
    });
  });
});
