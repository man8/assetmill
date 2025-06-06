"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialGenerator = void 0;
const path_1 = __importDefault(require("path"));
const image_processor_1 = require("../processors/image-processor");
class SocialGenerator {
    static async generate(sourceImage, config, outputDir) {
        const assets = [];
        const socialDir = path_1.default.join(outputDir, config.output.structure.social);
        const socialVariants = [
            {
                name: 'og-image',
                width: 1200,
                height: 630,
                format: 'png',
                margin: { all: '10%' },
                background: '#ffffff'
            },
            {
                name: 'twitter-card',
                width: 1200,
                height: 600,
                format: 'png',
                margin: { all: '10%' },
                background: '#ffffff'
            },
            {
                name: 'linkedin-share',
                width: 1200,
                height: 627,
                format: 'png',
                margin: { all: '10%' },
                background: '#ffffff'
            },
            {
                name: 'facebook-share',
                width: 1200,
                height: 630,
                format: 'png',
                margin: { all: '10%' },
                background: '#ffffff'
            },
        ];
        for (const variant of socialVariants) {
            const outputPath = path_1.default.join(socialDir, `${variant.name}.${variant.format}`);
            const asset = await image_processor_1.ImageProcessor.processImage(sourceImage, variant, outputPath, {
                quality: config.processing.quality.png,
                background: variant.background,
                margin: variant.margin,
            }, config);
            assets.push(asset);
        }
        return assets;
    }
    static generateMetaTags(assets, baseUrl = '', siteTitle = 'Website') {
        const tags = [];
        const ogImage = assets.find(asset => asset.name === 'og-image');
        const twitterCard = assets.find(asset => asset.name === 'twitter-card');
        if (ogImage) {
            tags.push(`<meta property="og:image" content="${baseUrl}/${path_1.default.basename(ogImage.path)}">`);
            tags.push(`<meta property="og:image:width" content="${ogImage.width}">`);
            tags.push(`<meta property="og:image:height" content="${ogImage.height}">`);
            tags.push(`<meta property="og:image:type" content="image/${ogImage.format}">`);
        }
        if (twitterCard) {
            tags.push(`<meta name="twitter:card" content="summary_large_image">`);
            tags.push(`<meta name="twitter:image" content="${baseUrl}/${path_1.default.basename(twitterCard.path)}">`);
        }
        tags.push(`<meta property="og:title" content="${siteTitle}">`);
        tags.push(`<meta name="twitter:title" content="${siteTitle}">`);
        return tags;
    }
    static generateStructuredData(assets, baseUrl = '', organisation = {}) {
        const ogImage = assets.find(asset => asset.name === 'og-image');
        const structuredData = {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: organisation.name || 'Organization',
            url: organisation.url || baseUrl,
            logo: ogImage ? `${baseUrl}/${path_1.default.basename(ogImage.path)}` : undefined,
            image: ogImage ? `${baseUrl}/${path_1.default.basename(ogImage.path)}` : undefined,
            description: organisation.description || '',
        };
        return JSON.stringify(structuredData, null, 2);
    }
}
exports.SocialGenerator = SocialGenerator;
//# sourceMappingURL=social-generator.js.map