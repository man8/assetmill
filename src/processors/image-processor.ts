import sharp from 'sharp';
import path from 'path';
import * as fs from 'fs-extra';
import { optimize as svgoOptimize, Config as SvgoConfig, PluginConfig } from 'svgo';
import { 
  SourceImage, 
  AssetVariant, 
  ProcessingOptions, 
  GeneratedAsset, 
  MarginConfig, 
  PipelineConfig, 
  MonochromeConfig,
  OverwriteMode 
} from '../types';
import { FileUtils } from '../utils/file-utils';

export class ImageProcessor {
  private static readonly SUPPORTED_INPUT_FORMATS = ['svg', 'png', 'jpeg', 'jpg'];
  private static readonly SUPPORTED_OUTPUT_FORMATS = ['png', 'jpeg', 'webp', 'avif', 'ico', 'svg'];

  /**
   * Returns the list of supported output formats for validation purposes.
   * 
   * @returns Array of supported output format strings
   */
  static getSupportedOutputFormats(): string[] {
    return [...this.SUPPORTED_OUTPUT_FORMATS];
  }

  /**
   * Returns the list of supported input formats for validation purposes.
   * 
   * @returns Array of supported input format strings
   */
  static getSupportedInputFormats(): string[] {
    return [...this.SUPPORTED_INPUT_FORMATS];
  }

  /**
   * Converts a hex color string to Sharp.js RGB format.
   * 
   * @param hexColor Hex color string (e.g., "#ffffff" or "#fff")
   * @returns Sharp RGB object with r, g, b, alpha properties
   */
  private static hexToRgb(hexColor: string): { r: number; g: number; b: number; alpha: number } {
    const hex = hexColor.replace('#', '');
    
    const fullHex = hex.length === 3 
      ? hex.split('').map(char => char + char).join('')
      : hex;
    
    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);
    
    return { r, g, b, alpha: 1 };
  }

  /**
   * Parses background color from string or object format to Sharp RGB format.
   * 
   * @param background Background color as hex string or RGB object
   * @returns Sharp RGB object with r, g, b, alpha properties
   */
  private static parseBackgroundColor(
    background?: string | object
  ): { r: number; g: number; b: number; alpha: number } {
    if (!background) {
      return { r: 0, g: 0, b: 0, alpha: 0 }; // Transparent default
    }
    
    if (typeof background === 'string') {
      return this.hexToRgb(background);
    }
    
    return background as { r: number; g: number; b: number; alpha: number };
  }

  private static setupBasePipeline(
    sourceImage: SourceImage
  ): sharp.Sharp {
    let pipeline = sharp(sourceImage.path);
    
    if (sourceImage.format === 'svg') {
      pipeline = sharp(sourceImage.path, { density: 300 });
    }
    
    return pipeline;
  }

  private static applyResizeAndBackground(
    pipeline: sharp.Sharp,
    variant: AssetVariant,
    options: ProcessingOptions = {}
  ): sharp.Sharp {
    if (variant.width || variant.height) {
      const backgroundColor = this.parseBackgroundColor(variant.background || options.background);
      const resizeOptions: sharp.ResizeOptions = {
        fit: 'contain',
        background: backgroundColor,
      };

      if (variant.width && variant.height) {
        resizeOptions.width = variant.width;
        resizeOptions.height = variant.height;
      } else if (variant.width) {
        resizeOptions.width = variant.width;
      } else if (variant.height) {
        resizeOptions.height = variant.height;
      }

      pipeline = pipeline.resize(resizeOptions);
      
      if (variant.background || options.background) {
        pipeline = pipeline.flatten({ background: backgroundColor });
      }
    }

    return pipeline;
  }

  private static applyThemes(
    pipeline: sharp.Sharp,
    variant: AssetVariant,
    options: ProcessingOptions = {},
    config?: PipelineConfig
  ): sharp.Sharp {
    if (variant.theme === 'dark' || options.theme === 'dark') {
      pipeline = pipeline.negate({ alpha: false });
    } else if (variant.theme === 'monochrome' || options.theme === 'monochrome' || variant.monochrome) {
      const monochromeConfig = this.parseMonochromeConfig(
        variant.monochrome, 
        config?.processing?.themes?.monochrome
      );
      pipeline = this.applyMonochromeTheme(pipeline, monochromeConfig);
    }

    return pipeline;
  }

  private static async applyFormatAndSave(
    pipeline: sharp.Sharp,
    variant: AssetVariant,
    outputPath: string,
    options: ProcessingOptions = {}
  ): Promise<GeneratedAsset> {
    const quality = variant.quality || options.quality || this.getDefaultQuality(variant.format);

    switch (variant.format) {
      case 'png':
        pipeline = pipeline.png({ quality, progressive: true, compressionLevel: 9 });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, progressive: true, mozjpeg: true });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality, lossless: false });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality, lossless: false });
        break;
      default:
        throw new Error(`Unsupported output format: ${variant.format}`);
    }

    await fs.ensureDir(path.dirname(outputPath));
    if (options.overwriteMode) {
      await FileUtils.checkOverwritePermission(outputPath, options.overwriteMode);
    }
    await pipeline.toFile(outputPath);

    const stats = await fs.stat(outputPath);
    const finalMetadata = await sharp(outputPath).metadata();

    return {
      name: variant.name,
      path: outputPath,
      format: variant.format,
      width: finalMetadata.width || 0,
      height: finalMetadata.height || 0,
      fileSize: stats.size,
      optimised: true,
    };
  }

  static async processImage(
    sourceImage: SourceImage,
    variant: AssetVariant,
    outputPath: string,
    options: ProcessingOptions = {},
    config?: PipelineConfig
  ): Promise<GeneratedAsset> {
    try {
      if (variant.format === 'ico') {
        return await this.generateMultiSizeIcoFile(sourceImage, variant, outputPath, options, config);
      }
      if (variant.format === 'svg') {
        return await this.processSvgOutput(sourceImage, variant, outputPath, options);
      }

      let pipeline = this.setupBasePipeline(sourceImage);
      await pipeline.metadata();

      pipeline = this.applyResizeAndBackground(pipeline, variant, options);

      if (variant.margin || options.margin) {
        pipeline = await this.applyMargin(pipeline, variant.margin || options.margin!, variant.width, variant.height);
      }

      pipeline = this.applyThemes(pipeline, variant, options, config);

      return await this.applyFormatAndSave(pipeline, variant, outputPath, options);
    } catch (error) {
      throw new Error(`Failed to process image ${sourceImage.path} for variant ${variant.name}: ${error}`);
    }
  }

  private static async applyMargin(
    pipeline: sharp.Sharp,
    margin: MarginConfig,
    targetWidth?: number,
    targetHeight?: number
  ): Promise<sharp.Sharp> {
    const metadata = await pipeline.metadata();
    const currentWidth = metadata.width || 0;
    const currentHeight = metadata.height || 0;

    const margins = this.calculateMargins(margin, targetWidth || currentWidth, targetHeight || currentHeight);
    
    const contentWidth = targetWidth ? Math.max(1, targetWidth - margins.left - margins.right) : currentWidth;
    const contentHeight = targetHeight ? Math.max(1, targetHeight - margins.top - margins.bottom) : currentHeight;
    
    const resizedPipeline = pipeline.resize(contentWidth, contentHeight, { 
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    });
    
    return resizedPipeline.extend({
      top: margins.top,
      bottom: margins.bottom,
      left: margins.left,
      right: margins.right,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }

  private static calculateMargins(margin: MarginConfig, width: number, height: number): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    const parseMargin = (value: number | string | undefined, dimension: number): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && value.endsWith('%')) {
        const percentage = parseFloat(value) / 100;
        return Math.round(dimension * percentage);
      }
      return 0;
    };

    const all = margin.all ? parseMargin(margin.all, Math.min(width, height)) : 0;
    const horizontal = margin.horizontal ? parseMargin(margin.horizontal, width) : all;
    const vertical = margin.vertical ? parseMargin(margin.vertical, height) : all;

    return {
      top: margin.top ? parseMargin(margin.top, height) : vertical,
      right: margin.right ? parseMargin(margin.right, width) : horizontal,
      bottom: margin.bottom ? parseMargin(margin.bottom, height) : vertical,
      left: margin.left ? parseMargin(margin.left, width) : horizontal,
    };
  }

  private static getDefaultQuality(format: string): number {
    switch (format) {
      case 'png': return 90;
      case 'jpeg': return 85;
      case 'webp': return 80;
      case 'avif': return 75;
      case 'svg': return 100;
      default: return 85;
    }
  }

  static async validateSourceImage(imagePath: string): Promise<SourceImage> {
    try {
      const exists = await fs.pathExists(imagePath);
      if (!exists) {
        throw new Error(`Source image not found: ${imagePath}`);
      }

      const metadata = await sharp(imagePath).metadata();
      const format = metadata.format as string;
      
      if (!format) {
        throw new Error(`Unable to determine image format for: ${imagePath}`);
      }

      if (!this.SUPPORTED_INPUT_FORMATS.includes(format)) {
        throw new Error(`Unsupported input format: ${format}`);
      }

      if (!metadata.width || !metadata.height) {
        throw new Error(`Unable to determine image dimensions for: ${imagePath}`);
      }

      if (format !== 'svg' && (metadata.width < 512 || metadata.height < 512)) {
        console.warn(`Warning: Source image ${imagePath} is smaller than recommended minimum (512x512)`);
      }

      return {
        path: imagePath,
        format: format as 'svg' | 'png' | 'jpeg' | 'jpg',
        width: metadata.width,
        height: metadata.height,
      };
    } catch (error) {
      throw new Error(`Failed to validate source image ${imagePath}: ${error}`);
    }
  }

  static async generateFavicon(
    sourceImage: SourceImage, 
    outputPath: string, 
    overwriteMode?: OverwriteMode
  ): Promise<GeneratedAsset[]> {
    const sizes = [16, 32, 48];
    const assets: GeneratedAsset[] = [];

    const buffers: Buffer[] = [];
    for (const size of sizes) {
      const buffer = await sharp(sourceImage.path)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      buffers.push(buffer);
    }

    await fs.ensureDir(path.dirname(outputPath));
    
    if (overwriteMode) {
      await FileUtils.checkOverwritePermission(outputPath, overwriteMode);
    }
    const icoBuffer = await this.createIcoFile(buffers, sizes);
    await fs.writeFile(outputPath, icoBuffer);

    const stats = await fs.stat(outputPath);
    assets.push({
      name: 'favicon.ico',
      path: outputPath,
      format: 'ico',
      width: 48,
      height: 48,
      fileSize: stats.size,
      optimised: true,
    });

    return assets;
  }

  private static async createIcoFile(buffers: Buffer[], sizes: number[]): Promise<Buffer> {
    const iconDir = Buffer.alloc(6);
    iconDir.writeUInt16LE(0, 0);
    iconDir.writeUInt16LE(1, 2);
    iconDir.writeUInt16LE(buffers.length, 4);

    const iconEntries: Buffer[] = [];
    let dataOffset = 6 + (buffers.length * 16);

    for (let i = 0; i < buffers.length; i++) {
      const entry = Buffer.alloc(16);
      entry.writeUInt8(sizes[i], 0);
      entry.writeUInt8(sizes[i], 1);
      entry.writeUInt8(0, 2);
      entry.writeUInt8(0, 3);
      entry.writeUInt16LE(1, 4);
      entry.writeUInt16LE(32, 6);
      entry.writeUInt32LE(buffers[i].length, 8);
      entry.writeUInt32LE(dataOffset, 12);
      
      iconEntries.push(entry);
      dataOffset += buffers[i].length;
    }

    return Buffer.concat([iconDir, ...iconEntries, ...buffers]);
  }

  /**
   * Generates a multi-size ICO file with standard favicon sizes.
   * 
   * @param sourceImage Source image to process
   * @param variant Asset variant configuration
   * @param outputPath Path to write the ICO file
   * @returns Generated asset metadata
   */
  static async generateMultiSizeIcoFile(
    sourceImage: SourceImage, 
    variant: AssetVariant, 
    outputPath: string,
    options: ProcessingOptions = {},
    config?: PipelineConfig
  ): Promise<GeneratedAsset> {
    const customSizes = variant.sizes;
    const requestedSize = variant.width || variant.height || 32;
    
    let sizes: number[];
    if (customSizes && customSizes.length > 0) {
      sizes = [...customSizes].sort((a, b) => a - b);
    } else {
      const standardSizes = [16, 32];
      sizes = standardSizes.includes(requestedSize) 
        ? standardSizes 
        : [...standardSizes, requestedSize].sort((a, b) => a - b);
    }
    
    const buffers: Buffer[] = [];
    for (const size of sizes) {
      let pipeline = this.setupBasePipeline(sourceImage);
      
      const sizeVariant = { ...variant, width: size, height: size };
      pipeline = this.applyResizeAndBackground(pipeline, sizeVariant, options);

      if (variant.margin || options.margin) {
        pipeline = await this.applyMargin(pipeline, variant.margin || options.margin!);
      }

      pipeline = this.applyThemes(pipeline, variant, options, config);
      
      const buffer = await pipeline.png().toBuffer();
      buffers.push(buffer);
    }

    await fs.ensureDir(path.dirname(outputPath));
    
    const icoBuffer = await this.createIcoFile(buffers, sizes);
    await fs.writeFile(outputPath, icoBuffer);

    const stats = await fs.stat(outputPath);
    
    return {
      name: variant.name,
      path: outputPath,
      format: 'ico',
      width: Math.max(...sizes),
      height: Math.max(...sizes),
      fileSize: stats.size,
      optimised: true,
    };
  }

  /**
   * Generates a single-size ICO file.
   * 
   * @param sourceImage Source image to process
   * @param variant Asset variant configuration
   * @param outputPath Path to write the ICO file
   * @returns Generated asset metadata
   */
  private static parseMonochromeConfig(
    variantMonochrome?: string | MonochromeConfig,
    globalMonochrome?: MonochromeConfig
  ): MonochromeConfig {
    if (typeof variantMonochrome === 'string') {
      return { color: variantMonochrome, threshold: 128 };
    }
    
    if (variantMonochrome && typeof variantMonochrome === 'object') {
      return {
        color: variantMonochrome.color || '#000000',
        threshold: variantMonochrome.threshold || 128
      };
    }
    
    if (globalMonochrome) {
      return {
        color: globalMonochrome.color || '#000000',
        threshold: globalMonochrome.threshold || 128
      };
    }
    
    return { color: '#000000', threshold: 128 };
  }

  private static applyMonochromeTheme(pipeline: sharp.Sharp, config: MonochromeConfig): sharp.Sharp {
    pipeline = pipeline.greyscale();
    
    const threshold = config.threshold || 128;
    const color = config.color || '#000000';
    
    if (color === '#ffffff' || color === '#fff') {
      const whiteThreshold = threshold < 100 ? threshold : 64;
      pipeline = pipeline.threshold(whiteThreshold, { greyscale: false });
    } else if (color === '#000000' || color === '#000') {
      pipeline = pipeline.threshold(threshold);
    } else {
      const customThreshold = threshold < 100 ? threshold : 64;
      pipeline = pipeline.threshold(customThreshold, { greyscale: false });
      const rgb = this.hexToRgb(color);
      pipeline = pipeline.tint(rgb);
    }
    
    return pipeline;
  }

  private static parseSvgConfig(variant: AssetVariant): Record<string, unknown> {
    return {
      monochrome: variant.monochrome || variant.svg?.monochrome,
      simplified: variant.simplified || variant.svg?.simplified,
      viewBox: variant.viewBox || variant.svg?.viewBox,
      preserveAspectRatio: variant.preserveAspectRatio || variant.svg?.preserveAspectRatio,
      colorTransforms: variant.colorTransforms || variant.svg?.colorTransforms,
      ...variant.svg
    };
  }

  private static transformSvgContent(svgContent: string, svgConfig: Record<string, unknown>): string {
    if (svgConfig.monochrome) {
      svgContent = svgContent
        .replace(/fill="[^"]{0,100}"/g, `fill="${svgConfig.monochrome}"`)
        .replace(/stroke="[^"]{0,100}"/g, `stroke="${svgConfig.monochrome}"`)
        .replace(/fill:[^;"}]{0,100}/g, `fill:${svgConfig.monochrome}`)
        .replace(/stroke:[^;"}]{0,100}/g, `stroke:${svgConfig.monochrome}`)
        .replace(/stop-color="[^"]{0,100}"/g, `stop-color="${svgConfig.monochrome}"`)
        .replace(/stop-color:[^;"}]{0,100}/g, `stop-color:${svgConfig.monochrome}`);
      
      if (svgConfig.simplified) {
        svgContent = svgContent
          .replace(/<defs\b[^>]*>[\s\S]{0,10000}?<\/defs>/g, '')
          .replace(/<linearGradient\b[^>]*>[\s\S]{0,5000}?<\/linearGradient>/g, '')
          .replace(/<radialGradient\b[^>]*>[\s\S]{0,5000}?<\/radialGradient>/g, '')
          .replace(/<pattern\b[^>]*>[\s\S]{0,5000}?<\/pattern>/g, '')
          .replace(/<filter\b[^>]*>[\s\S]{0,5000}?<\/filter>/g, '')
          .replace(/<mask\b[^>]*>[\s\S]{0,5000}?<\/mask>/g, '');
      }
    }
    
    return svgContent;
  }

  private static applySvgAttributes(optimisedSvg: string, svgConfig: Record<string, unknown>): string {
    if (svgConfig.viewBox) {
      optimisedSvg = optimisedSvg.replace(
        /viewBox="[^"]{0,100}"/,
        `viewBox="${svgConfig.viewBox}"`
      );
    }
    
    if (svgConfig.preserveAspectRatio) {
      if (optimisedSvg.includes('preserveAspectRatio=')) {
        optimisedSvg = optimisedSvg.replace(
          /preserveAspectRatio="[^"]{0,50}"/,
          `preserveAspectRatio="${svgConfig.preserveAspectRatio}"`
        );
      } else {
        optimisedSvg = optimisedSvg.replace(
          /<svg\s+([^>]{0,1000}?)>/,
          `<svg $1 preserveAspectRatio="${svgConfig.preserveAspectRatio}">`
        );
      }
    }
    
    return optimisedSvg;
  }

  private static async processSvgOutput(
    sourceImage: SourceImage,
    variant: AssetVariant,
    outputPath: string,
    options: ProcessingOptions = {}
  ): Promise<GeneratedAsset> {
    let svgContent: string;
    
    if (sourceImage.format === 'svg') {
      svgContent = await fs.readFile(sourceImage.path, 'utf-8');
    } else {
      throw new Error('SVG output from raster input not yet supported');
    }

    const svgConfig = this.parseSvgConfig(variant);
    const svgoPlugins: PluginConfig[] = [];

    if (svgConfig.simplified) {
      svgoPlugins.push(
        { name: 'removeAttrs', params: { attrs: ['filter', 'gradient', 'mask', 'clip-path'] } }
      );
    }

    svgContent = this.transformSvgContent(svgContent, svgConfig);

    if (svgConfig.monochrome && svgConfig.simplified) {
      svgoPlugins.push({
        name: 'removeAttrs',
        params: { 
          attrs: ['clip-path', 'mask', 'filter']
        }
      });
    }

    if (svgConfig.colorTransforms && Array.isArray(svgConfig.colorTransforms) && 
        svgConfig.colorTransforms.length > 0) {
      console.warn('Color transforms are not yet supported in SVG processing');
    }

    const svgoConfig: SvgoConfig = {
      plugins: [
        'preset-default',
        ...svgoPlugins
      ]
    };

    const result = svgoOptimize(svgContent, svgoConfig);
    let optimisedSvg = result.data;

    optimisedSvg = this.applySvgAttributes(optimisedSvg, svgConfig);

    await fs.ensureDir(path.dirname(outputPath));
    if (options.overwriteMode) {
      await FileUtils.checkOverwritePermission(outputPath, options.overwriteMode);
    }
    await fs.writeFile(outputPath, optimisedSvg, 'utf-8');

    const stats = await fs.stat(outputPath);
      
    return {
      name: variant.name,
      path: outputPath,
      format: 'svg',
      width: variant.width || sourceImage.width,
      height: variant.height || sourceImage.height,
      fileSize: stats.size,
      optimised: true,
    };
  }

  static async generateSingleIcoFile(
    sourceImage: SourceImage, 
    variant: AssetVariant, 
    outputPath: string,
    overwriteMode?: OverwriteMode
  ): Promise<GeneratedAsset> {
    const size = variant.width || variant.height || 32;
    const background = this.parseBackgroundColor(variant.background);
    
    let pipeline = sharp(sourceImage.path)
      .resize(size, size, { fit: 'contain', background });
    
    if (variant.background) {
      pipeline = pipeline.flatten({ background });
    }
    
    const buffer = await pipeline.png().toBuffer();

    await fs.ensureDir(path.dirname(outputPath));
    
    if (overwriteMode) {
      await FileUtils.checkOverwritePermission(outputPath, overwriteMode);
    }
    const icoBuffer = await this.createIcoFile([buffer], [size]);
    await fs.writeFile(outputPath, icoBuffer);

    const stats = await fs.stat(outputPath);
    
    return {
      name: variant.name,
      path: outputPath,
      format: 'ico',
      width: size,
      height: size,
      fileSize: stats.size,
      optimised: true,
    };
  }
}
