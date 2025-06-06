"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageProcessor = void 0;
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs-extra"));
class ImageProcessor {
    /**
     * Returns the list of supported output formats for validation purposes.
     *
     * @returns Array of supported output format strings
     */
    static getSupportedOutputFormats() {
        return [...this.SUPPORTED_OUTPUT_FORMATS];
    }
    /**
     * Returns the list of supported input formats for validation purposes.
     *
     * @returns Array of supported input format strings
     */
    static getSupportedInputFormats() {
        return [...this.SUPPORTED_INPUT_FORMATS];
    }
    /**
     * Converts a hex color string to Sharp.js RGB format.
     *
     * @param hexColor Hex color string (e.g., "#ffffff" or "#fff")
     * @returns Sharp RGB object with r, g, b, alpha properties
     */
    static hexToRgb(hexColor) {
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
    static parseBackgroundColor(background) {
        if (!background) {
            return { r: 0, g: 0, b: 0, alpha: 0 }; // Transparent default
        }
        if (typeof background === 'string') {
            return this.hexToRgb(background);
        }
        return background;
    }
    static async processImage(sourceImage, variant, outputPath, options = {}, config) {
        try {
            let pipeline = (0, sharp_1.default)(sourceImage.path);
            if (sourceImage.format === 'svg') {
                pipeline = (0, sharp_1.default)(sourceImage.path, { density: 300 });
            }
            await pipeline.metadata();
            if (variant.width || variant.height) {
                const backgroundColor = this.parseBackgroundColor(variant.background || options.background);
                const resizeOptions = {
                    fit: 'contain',
                    background: backgroundColor,
                };
                if (variant.width && variant.height) {
                    resizeOptions.width = variant.width;
                    resizeOptions.height = variant.height;
                }
                else if (variant.width) {
                    resizeOptions.width = variant.width;
                }
                else if (variant.height) {
                    resizeOptions.height = variant.height;
                }
                pipeline = pipeline.resize(resizeOptions);
                if (variant.background || options.background) {
                    pipeline = pipeline.flatten({ background: backgroundColor });
                }
            }
            if (variant.margin || options.margin) {
                pipeline = await this.applyMargin(pipeline, variant.margin || options.margin, variant.width, variant.height);
            }
            if (variant.theme === 'dark' || options.theme === 'dark') {
                pipeline = pipeline.negate({ alpha: false });
            }
            else if (variant.theme === 'monochrome' || options.theme === 'monochrome' || variant.monochrome) {
                const monochromeConfig = this.parseMonochromeConfig(variant.monochrome, config?.processing?.themes?.monochrome);
                pipeline = this.applyMonochromeTheme(pipeline, monochromeConfig);
            }
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
                case 'ico':
                    return await this.generateMultiSizeIcoFile(sourceImage, variant, outputPath, options, config);
                default:
                    throw new Error(`Unsupported output format: ${variant.format}`);
            }
            await fs.ensureDir(path_1.default.dirname(outputPath));
            await pipeline.toFile(outputPath);
            const stats = await fs.stat(outputPath);
            const finalMetadata = await (0, sharp_1.default)(outputPath).metadata();
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
        catch (error) {
            throw new Error(`Failed to process image ${sourceImage.path} for variant ${variant.name}: ${error}`);
        }
    }
    static async applyMargin(pipeline, margin, targetWidth, targetHeight) {
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
    static calculateMargins(margin, width, height) {
        const parseMargin = (value, dimension) => {
            if (typeof value === 'number')
                return value;
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
    static getDefaultQuality(format) {
        switch (format) {
            case 'png': return 90;
            case 'jpeg': return 85;
            case 'webp': return 80;
            case 'avif': return 75;
            default: return 85;
        }
    }
    static async validateSourceImage(imagePath) {
        try {
            const exists = await fs.pathExists(imagePath);
            if (!exists) {
                throw new Error(`Source image not found: ${imagePath}`);
            }
            const metadata = await (0, sharp_1.default)(imagePath).metadata();
            const format = metadata.format;
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
                format: format,
                width: metadata.width,
                height: metadata.height,
            };
        }
        catch (error) {
            throw new Error(`Failed to validate source image ${imagePath}: ${error}`);
        }
    }
    static async generateFavicon(sourceImage, outputPath) {
        const sizes = [16, 32, 48];
        const assets = [];
        const buffers = [];
        for (const size of sizes) {
            const buffer = await (0, sharp_1.default)(sourceImage.path)
                .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .png()
                .toBuffer();
            buffers.push(buffer);
        }
        await fs.ensureDir(path_1.default.dirname(outputPath));
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
    static async createIcoFile(buffers, sizes) {
        const iconDir = Buffer.alloc(6);
        iconDir.writeUInt16LE(0, 0);
        iconDir.writeUInt16LE(1, 2);
        iconDir.writeUInt16LE(buffers.length, 4);
        const iconEntries = [];
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
    static async generateMultiSizeIcoFile(sourceImage, variant, outputPath, options = {}, config) {
        const customSizes = variant.sizes;
        const requestedSize = variant.width || variant.height || 32;
        let sizes;
        if (customSizes && customSizes.length > 0) {
            sizes = [...customSizes].sort((a, b) => a - b);
        }
        else {
            const standardSizes = [16, 32];
            sizes = standardSizes.includes(requestedSize)
                ? standardSizes
                : [...standardSizes, requestedSize].sort((a, b) => a - b);
        }
        const buffers = [];
        for (const size of sizes) {
            const background = this.parseBackgroundColor(variant.background || options.background);
            let pipeline = (0, sharp_1.default)(sourceImage.path)
                .resize(size, size, { fit: 'contain', background });
            if (variant.background || options.background) {
                pipeline = pipeline.flatten({ background });
            }
            if (variant.margin || options.margin) {
                pipeline = await this.applyMargin(pipeline, variant.margin || options.margin);
            }
            if (variant.theme === 'dark' || options.theme === 'dark') {
                pipeline = pipeline.negate({ alpha: false });
            }
            else if (variant.theme === 'monochrome' || options.theme === 'monochrome' || variant.monochrome) {
                const monochromeConfig = this.parseMonochromeConfig(variant.monochrome, config?.processing?.themes?.monochrome);
                pipeline = this.applyMonochromeTheme(pipeline, monochromeConfig);
            }
            const buffer = await pipeline.png().toBuffer();
            buffers.push(buffer);
        }
        await fs.ensureDir(path_1.default.dirname(outputPath));
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
    static parseMonochromeConfig(variantMonochrome, globalMonochrome) {
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
    static applyMonochromeTheme(pipeline, config) {
        pipeline = pipeline.greyscale();
        const threshold = config.threshold || 128;
        const color = config.color || '#000000';
        if (color === '#ffffff' || color === '#fff') {
            const whiteThreshold = threshold < 100 ? threshold : 64;
            pipeline = pipeline.threshold(whiteThreshold, { greyscale: false });
        }
        else if (color === '#000000' || color === '#000') {
            pipeline = pipeline.threshold(threshold);
        }
        else {
            const customThreshold = threshold < 100 ? threshold : 64;
            pipeline = pipeline.threshold(customThreshold, { greyscale: false });
            const rgb = this.hexToRgb(color);
            pipeline = pipeline.tint(rgb);
        }
        return pipeline;
    }
    static async generateSingleIcoFile(sourceImage, variant, outputPath) {
        const size = variant.width || variant.height || 32;
        const background = this.parseBackgroundColor(variant.background);
        let pipeline = (0, sharp_1.default)(sourceImage.path)
            .resize(size, size, { fit: 'contain', background });
        if (variant.background) {
            pipeline = pipeline.flatten({ background });
        }
        const buffer = await pipeline.png().toBuffer();
        await fs.ensureDir(path_1.default.dirname(outputPath));
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
exports.ImageProcessor = ImageProcessor;
ImageProcessor.SUPPORTED_INPUT_FORMATS = ['svg', 'png', 'jpeg', 'jpg'];
ImageProcessor.SUPPORTED_OUTPUT_FORMATS = ['png', 'jpeg', 'webp', 'avif', 'ico'];
//# sourceMappingURL=image-processor.js.map