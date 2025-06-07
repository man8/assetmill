import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { AssetPipeline } from '../pipeline/asset-pipeline';
import { PipelineConfig } from '../types';
import { Logger } from '../utils/logger';

describe('File Overwrite Protection', () => {
  const testOutputDir = path.join(__dirname, 'overwrite-test-output');
  const testImagePath = path.join(testOutputDir, 'test-icon.svg');
  
  let loggerErrorSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerInfoSpy: jest.SpyInstance;

  beforeEach(async () => {
    await fs.ensureDir(testOutputDir);
    
    const testSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" fill="#007acc"/>
    </svg>`;
    await fs.writeFile(testImagePath, testSvgContent);
    
    loggerErrorSpy = jest.spyOn(Logger, 'error').mockImplementation(() => {});
    loggerWarnSpy = jest.spyOn(Logger, 'warn').mockImplementation(() => {});
    loggerInfoSpy = jest.spyOn(Logger, 'info').mockImplementation(() => {});
  });

  afterEach(async () => {
    await fs.remove(testOutputDir);
    jest.restoreAllMocks();
  });

  const createTestConfig = (overwriteMode: 'error' | 'warn' | 'allow'): PipelineConfig => ({
    source: {
      images: [testImagePath],
      formats: ['svg'],
      validation: {
        minWidth: 16,
        minHeight: 16,
        maxFileSize: 52428800,
        requireTransparency: false,
      },
      defaults: { favicon: false, social: false, logos: false, platforms: false },
    },
    output: {
      directory: testOutputDir,
      structure: {
        favicon: 'favicon',
        social: 'social',
        logos: 'logos',
        platforms: 'platforms',
      },
      naming: {
        template: '{name}',
        variables: {},
      },
      formats: ['png'],
      overwrite: overwriteMode,
    },
    assets: [
      {
        name: 'test-asset',
        type: 'favicon',
        source: 'test-icon.svg',
        outputPath: './',
        variants: [
          {
            name: 'test-favicon',
            width: 32,
            height: 32,
            format: 'png',
          },
        ],
      },
    ],
    processing: {
      quality: {
        png: 90,
        jpeg: 85,
        webp: 80,
        avif: 75,
        svg: 100,
      },
      optimisation: {
        progressive: true,
        optimise: true,
        lossless: false,
      },
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
  });

  it('should emit specific error message when file exists and overwrite mode is error', async () => {
    const config = createTestConfig('error');
    const pipeline = new AssetPipeline(config);

    await pipeline.execute();

    jest.clearAllMocks();

    const result = await pipeline.execute();

    expect(result.success).toBe(false);
    expect(result.metrics.failedAssets).toBe(1);
    
    expect(loggerErrorSpy).toHaveBeenCalledWith('Failed to generate asset test-favicon: File already exists');
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      '  → Use --force flag or set \'overwrite: allow\' in config to overwrite existing files'
    );
  });

  it('should emit warning message when file exists and overwrite mode is warn', async () => {
    const config = createTestConfig('warn');
    const pipeline = new AssetPipeline(config);

    await pipeline.execute();

    jest.clearAllMocks();

    const result = await pipeline.execute();

    expect(result.success).toBe(true);
    expect(result.metrics.failedAssets).toBe(0);
    
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Overwriting existing file:')
    );
  });

  it('should allow overwrite when overwrite mode is allow', async () => {
    const config = createTestConfig('allow');
    const pipeline = new AssetPipeline(config);

    const firstResult = await pipeline.execute();
    expect(firstResult.success).toBe(true);

    jest.clearAllMocks();

    const secondResult = await pipeline.execute();

    expect(secondResult.success).toBe(true);
    expect(secondResult.metrics.failedAssets).toBe(0);
    
    expect(loggerErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('File already exists')
    );
    expect(loggerWarnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Overwriting existing file:')
    );
  });
});
