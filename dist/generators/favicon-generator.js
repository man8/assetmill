"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaviconGenerator = void 0;
const path_1 = __importDefault(require("path"));
const image_processor_1 = require("../processors/image-processor");
class FaviconGenerator {
    static async generate(sourceImage, config, outputDir) {
        const assets = [];
        const faviconDir = path_1.default.join(outputDir, config.output.structure.favicon);
        const faviconVariants = [
            { name: 'favicon-16x16', width: 16, height: 16, format: 'png' },
            { name: 'favicon-32x32', width: 32, height: 32, format: 'png' },
            { name: 'apple-touch-icon', width: 180, height: 180, format: 'png' },
            { name: 'android-chrome-192x192', width: 192, height: 192, format: 'png' },
            { name: 'android-chrome-512x512', width: 512, height: 512, format: 'png' },
            { name: 'mstile-150x150', width: 150, height: 150, format: 'png' },
        ];
        for (const variant of faviconVariants) {
            const outputPath = path_1.default.join(faviconDir, `${variant.name}.${variant.format}`);
            const asset = await image_processor_1.ImageProcessor.processImage(sourceImage, variant, outputPath, {
                quality: config.processing.quality.png,
            }, config);
            assets.push(asset);
        }
        const faviconIcoPath = path_1.default.join(faviconDir, 'favicon.ico');
        const icoAssets = await image_processor_1.ImageProcessor.generateFavicon(sourceImage, faviconIcoPath);
        assets.push(...icoAssets);
        return assets;
    }
    static generateWebmanifest(assets, baseUrl = '') {
        const icons = assets
            .filter(asset => asset.name.includes('android-chrome'))
            .map(asset => ({
            src: `${baseUrl}/${path_1.default.basename(asset.path)}`,
            sizes: `${asset.width}x${asset.height}`,
            type: `image/${asset.format}`,
        }));
        const manifest = {
            name: 'Web App',
            short_name: 'App',
            icons,
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
        };
        return JSON.stringify(manifest, null, 2);
    }
    static generateBrowserConfigXml(assets, baseUrl = '') {
        const mstile = assets.find(asset => asset.name.includes('mstile'));
        const tileImage = mstile ? `${baseUrl}/${path_1.default.basename(mstile.path)}` : '';
        return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="${tileImage}"/>
            <TileColor>#ffffff</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;
    }
    static generateHtmlTags(assets, baseUrl = '') {
        const tags = [];
        const favicon16 = assets.find(asset => asset.name === 'favicon-16x16');
        const favicon32 = assets.find(asset => asset.name === 'favicon-32x32');
        const appleTouchIcon = assets.find(asset => asset.name === 'apple-touch-icon');
        if (favicon16) {
            tags.push(`<link rel="icon" type="image/png" sizes="16x16" href="${baseUrl}/${path_1.default.basename(favicon16.path)}">`);
        }
        if (favicon32) {
            tags.push(`<link rel="icon" type="image/png" sizes="32x32" href="${baseUrl}/${path_1.default.basename(favicon32.path)}">`);
        }
        if (appleTouchIcon) {
            tags.push(`<link rel="apple-touch-icon" sizes="180x180" href="${baseUrl}/${path_1.default.basename(appleTouchIcon.path)}">`);
        }
        tags.push(`<link rel="manifest" href="${baseUrl}/site.webmanifest">`);
        tags.push(`<meta name="msapplication-config" content="${baseUrl}/browserconfig.xml">`);
        return tags;
    }
}
exports.FaviconGenerator = FaviconGenerator;
//# sourceMappingURL=favicon-generator.js.map