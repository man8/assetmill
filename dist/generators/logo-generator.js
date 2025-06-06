"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoGenerator = void 0;
const path_1 = __importDefault(require("path"));
const image_processor_1 = require("../processors/image-processor");
class LogoGenerator {
    static async generate(sourceImage, config, outputDir) {
        const assets = [];
        const logosDir = path_1.default.join(outputDir, config.output.structure.logos);
        const standardSizes = [24, 32, 48, 64, 128, 256];
        const headerSizes = [120, 150, 200];
        for (const size of standardSizes) {
            const variants = await this.generateSizeVariants(sourceImage, size, size, logosDir, config);
            assets.push(...variants);
        }
        for (const width of headerSizes) {
            const variants = await this.generateSizeVariants(sourceImage, width, undefined, logosDir, config);
            assets.push(...variants);
        }
        return assets;
    }
    static async generateSizeVariants(sourceImage, width, height, outputDir, config) {
        const assets = [];
        const baseName = height ? `logo-${width}x${height}` : `logo-${width}w`;
        const themes = [];
        if (config.processing.themes.light.enabled)
            themes.push('light');
        if (config.processing.themes.dark.enabled)
            themes.push('dark');
        if (config.processing.themes.monochrome.enabled)
            themes.push('monochrome');
        for (const theme of themes) {
            for (const format of config.output.formats) {
                if (format === 'ico')
                    continue;
                const variant = {
                    name: theme === 'light' ? baseName : `${baseName}-${theme}`,
                    width,
                    height,
                    format,
                    theme,
                };
                const outputPath = path_1.default.join(outputDir, `${variant.name}.${format}`);
                const asset = await image_processor_1.ImageProcessor.processImage(sourceImage, variant, outputPath, {
                    quality: config.processing.quality[format],
                    theme,
                }, config);
                assets.push(asset);
            }
        }
        return assets;
    }
    static generateCssVariables(assets, baseUrl = '') {
        const cssVars = [];
        const logosBySize = new Map();
        assets.forEach(asset => {
            const sizeKey = `${asset.width}x${asset.height}`;
            if (!logosBySize.has(sizeKey)) {
                logosBySize.set(sizeKey, []);
            }
            logosBySize.get(sizeKey).push(asset);
        });
        logosBySize.forEach((sizeAssets, size) => {
            const lightLogo = sizeAssets.find(a => !a.name.includes('-dark') && !a.name.includes('-monochrome'));
            const darkLogo = sizeAssets.find(a => a.name.includes('-dark'));
            if (lightLogo) {
                cssVars.push(`  --logo-${size}: url('${baseUrl}/${path_1.default.basename(lightLogo.path)}');`);
            }
            if (darkLogo) {
                cssVars.push(`  --logo-${size}-dark: url('${baseUrl}/${path_1.default.basename(darkLogo.path)}');`);
            }
        });
        return `:root {\n${cssVars.join('\n')}\n}`;
    }
}
exports.LogoGenerator = LogoGenerator;
//# sourceMappingURL=logo-generator.js.map