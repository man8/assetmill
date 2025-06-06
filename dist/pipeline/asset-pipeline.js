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
exports.AssetPipeline = void 0;
const path_1 = __importDefault(require("path"));
const favicon_generator_1 = require("../generators/favicon-generator");
const social_generator_1 = require("../generators/social-generator");
const logo_generator_1 = require("../generators/logo-generator");
const platform_generator_1 = require("../generators/platform-generator");
const validation_1 = require("../utils/validation");
const file_utils_1 = require("../utils/file-utils");
const logger_1 = require("../utils/logger");
class AssetPipeline {
    constructor(config, dryRun = false) {
        this.config = config;
        this.dryRun = dryRun;
    }
    async execute() {
        const startTime = Date.now();
        const result = {
            success: false,
            assets: [],
            errors: [],
            metrics: {
                totalAssets: 0,
                successfulAssets: 0,
                failedAssets: 0,
                totalFileSize: 0,
                processingTime: 0,
            },
        };
        try {
            logger_1.Logger.info('Starting image asset pipeline...');
            const validationErrors = validation_1.ValidationUtils.validateConfigPaths(this.config);
            if (validationErrors.length > 0) {
                result.errors.push({ message: `Configuration validation failed:\n${validationErrors.join('\n')}` });
                return result;
            }
            const sourceImages = await validation_1.ValidationUtils.validateSourceImages(this.config);
            logger_1.Logger.success(`Validated ${sourceImages.length} source image(s)`);
            if (!this.dryRun) {
                await validation_1.ValidationUtils.validateOutputDirectory(this.config.output.directory);
            }
            for (const sourceImage of sourceImages) {
                logger_1.Logger.info(`Processing source image: ${path_1.default.basename(sourceImage.path)}`);
                const imageAssets = await this.processSourceImage(sourceImage);
                result.assets.push(...imageAssets);
            }
            result.success = true;
            result.metrics = this.calculateMetrics(result.assets, startTime);
            logger_1.Logger.success(`Pipeline completed successfully!`);
            logger_1.Logger.info(`Generated ${result.assets.length} assets`);
            logger_1.Logger.info(`Total file size: ${file_utils_1.FileUtils.formatFileSize(result.metrics.totalFileSize)}`);
            logger_1.Logger.info(`Processing time: ${result.metrics.processingTime}ms`);
        }
        catch (error) {
            logger_1.Logger.error('Pipeline execution failed', error);
            result.errors.push({
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            });
        }
        return result;
    }
    async processSourceImage(sourceImage) {
        const assets = [];
        if (this.dryRun) {
            logger_1.Logger.info('Dry run mode - skipping actual file generation');
            return this.simulateAssetGeneration();
        }
        try {
            const shouldGenerateDefaults = this.shouldGenerateDefaultAssets(sourceImage);
            if (shouldGenerateDefaults.favicon) {
                logger_1.Logger.progress('Generating favicon assets...');
                const faviconAssets = await favicon_generator_1.FaviconGenerator.generate(sourceImage, this.config, this.config.output.directory);
                assets.push(...faviconAssets);
                logger_1.Logger.success(`Generated ${faviconAssets.length} favicon assets`);
            }
            if (shouldGenerateDefaults.social) {
                logger_1.Logger.progress('Generating social media assets...');
                const socialAssets = await social_generator_1.SocialGenerator.generate(sourceImage, this.config, this.config.output.directory);
                assets.push(...socialAssets);
                logger_1.Logger.success(`Generated ${socialAssets.length} social media assets`);
            }
            if (shouldGenerateDefaults.logos) {
                logger_1.Logger.progress('Generating logo variants...');
                const logoAssets = await logo_generator_1.LogoGenerator.generate(sourceImage, this.config, this.config.output.directory);
                assets.push(...logoAssets);
                logger_1.Logger.success(`Generated ${logoAssets.length} logo variants`);
            }
            if (shouldGenerateDefaults.platforms && this.config.platforms && this.config.platforms.length > 0) {
                logger_1.Logger.progress('Generating platform-specific assets...');
                const platformAssets = await platform_generator_1.PlatformGenerator.generate(sourceImage, this.config, this.config.output.directory);
                assets.push(...platformAssets);
                logger_1.Logger.success(`Generated ${platformAssets.length} platform-specific assets`);
            }
            for (const assetDef of this.config.assets) {
                if (this.shouldGenerateCustomAsset(sourceImage, assetDef)) {
                    logger_1.Logger.progress(`Generating custom assets for ${assetDef.name}...`);
                    const customAssets = await this.generateCustomAssets(sourceImage, assetDef);
                    assets.push(...customAssets);
                    logger_1.Logger.success(`Generated ${customAssets.length} custom assets for ${assetDef.name}`);
                }
            }
        }
        catch (error) {
            logger_1.Logger.error(`Failed to process source image ${sourceImage.path}`, error);
            throw error;
        }
        return assets;
    }
    async generateCustomAssets(sourceImage, assetDef) {
        const assets = [];
        let outputPath;
        if (assetDef.outputPath) {
            if (path_1.default.isAbsolute(assetDef.outputPath)) {
                outputPath = assetDef.outputPath;
            }
            else {
                outputPath = path_1.default.join(this.config.output.directory, assetDef.outputPath);
            }
        }
        else {
            outputPath = path_1.default.join(this.config.output.directory, this.config.output.structure[assetDef.type] || '');
        }
        for (const variant of assetDef.variants) {
            try {
                const variantObj = variant;
                const fullOutputPath = path_1.default.join(outputPath, `${variantObj.name}.${variantObj.format}`);
                const { ImageProcessor } = await Promise.resolve().then(() => __importStar(require('../processors/image-processor')));
                const asset = await ImageProcessor.processImage(sourceImage, variantObj, fullOutputPath, {
                    quality: variantObj.quality ||
                        this.config.processing.quality[variantObj.format],
                    background: variantObj.background,
                    margin: variantObj.margin,
                    theme: variantObj.theme,
                }, this.config);
                assets.push(asset);
            }
            catch (error) {
                const variantObj = variant;
                logger_1.Logger.error(`Failed to generate asset ${variantObj.name}`, error);
            }
        }
        return assets;
    }
    simulateAssetGeneration() {
        const assets = [];
        for (const assetDef of this.config.assets) {
            for (const variant of assetDef.variants) {
                const variantObj = variant;
                const width = variantObj.width || 32;
                const height = variantObj.height || 32;
                const format = variantObj.format;
                let estimatedSize = width * height;
                if (format === 'jpeg')
                    estimatedSize *= 0.3;
                else if (format === 'webp')
                    estimatedSize *= 0.25;
                else if (format === 'avif')
                    estimatedSize *= 0.2;
                else if (format === 'ico')
                    estimatedSize *= 1.5;
                else
                    estimatedSize *= 0.8;
                assets.push({
                    name: variantObj.name,
                    path: `/simulated/${variantObj.name}.${format}`,
                    format: format,
                    width,
                    height,
                    fileSize: Math.round(estimatedSize),
                    optimised: true,
                });
            }
        }
        return assets;
    }
    calculateMetrics(assets, startTime) {
        const totalFileSize = assets.reduce((sum, asset) => sum + asset.fileSize, 0);
        return {
            totalAssets: assets.length,
            successfulAssets: assets.length,
            failedAssets: 0,
            totalFileSize,
            processingTime: Date.now() - startTime,
        };
    }
    async generateManifestFiles() {
        if (this.dryRun) {
            logger_1.Logger.info('Dry run mode - skipping manifest file generation');
            return;
        }
        const faviconAssets = this.getAssetsByType();
        const socialAssets = this.getAssetsByType();
        if (faviconAssets.length > 0) {
            const webmanifest = favicon_generator_1.FaviconGenerator.generateWebmanifest(faviconAssets);
            const webmanifestPath = path_1.default.join(this.config.output.directory, 'site.webmanifest');
            await file_utils_1.FileUtils.writeTextFile(webmanifestPath, webmanifest);
            logger_1.Logger.success('Generated site.webmanifest');
            const browserConfig = favicon_generator_1.FaviconGenerator.generateBrowserConfigXml(faviconAssets);
            const browserConfigPath = path_1.default.join(this.config.output.directory, 'browserconfig.xml');
            await file_utils_1.FileUtils.writeTextFile(browserConfigPath, browserConfig);
            logger_1.Logger.success('Generated browserconfig.xml');
            const htmlTags = favicon_generator_1.FaviconGenerator.generateHtmlTags(faviconAssets);
            const htmlTagsPath = path_1.default.join(this.config.output.directory, 'favicon-tags.html');
            await file_utils_1.FileUtils.writeTextFile(htmlTagsPath, htmlTags.join('\n'));
            logger_1.Logger.success('Generated favicon-tags.html');
        }
        if (socialAssets.length > 0) {
            const metaTags = social_generator_1.SocialGenerator.generateMetaTags(socialAssets);
            const metaTagsPath = path_1.default.join(this.config.output.directory, 'social-meta-tags.html');
            await file_utils_1.FileUtils.writeTextFile(metaTagsPath, metaTags.join('\n'));
            logger_1.Logger.success('Generated social-meta-tags.html');
        }
    }
    shouldGenerateDefaultAssets(sourceImage) {
        const defaults = this.config.source.defaults || {
            favicon: true,
            social: true,
            logos: true,
            platforms: true,
        };
        const hasCustomFavicon = this.config.assets.some(asset => asset.type === 'favicon' && this.shouldGenerateCustomAsset(sourceImage, asset));
        const hasCustomSocial = this.config.assets.some(asset => asset.type === 'social' && this.shouldGenerateCustomAsset(sourceImage, asset));
        const hasCustomLogos = this.config.assets.some(asset => asset.type === 'logo' && this.shouldGenerateCustomAsset(sourceImage, asset));
        const hasCustomPlatforms = this.config.assets.some(asset => asset.type === 'platform-specific' && this.shouldGenerateCustomAsset(sourceImage, asset));
        return {
            favicon: defaults.favicon !== false && !hasCustomFavicon,
            social: defaults.social !== false && !hasCustomSocial,
            logos: defaults.logos !== false && !hasCustomLogos,
            platforms: defaults.platforms !== false && !hasCustomPlatforms,
        };
    }
    shouldGenerateCustomAsset(sourceImage, assetDef) {
        if (!assetDef.source) {
            return true;
        }
        const sourceImageName = path_1.default.basename(sourceImage.path);
        const assetSourceName = path_1.default.basename(assetDef.source);
        return sourceImageName === assetSourceName || sourceImage.path === assetDef.source;
    }
    getAssetsByType() {
        return [];
    }
}
exports.AssetPipeline = AssetPipeline;
//# sourceMappingURL=asset-pipeline.js.map