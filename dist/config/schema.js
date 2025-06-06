"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.validateConfig = validateConfig;
exports.mergeWithDefaults = mergeWithDefaults;
exports.DEFAULT_CONFIG = {
    source: {
        images: ['icon.svg', 'logo-colour-black.svg', 'logo-colour-white.svg'],
        formats: ['svg', 'png', 'jpeg'],
        validation: {
            minWidth: 512,
            minHeight: 512,
            maxFileSize: 50 * 1024 * 1024,
            requireTransparency: true,
        },
        defaults: {
            favicon: false,
            social: false,
            logos: false,
            platforms: false,
        },
    },
    output: {
        directory: './assets',
        structure: {
            favicon: 'public/favicon',
            social: 'assets/social',
            logos: 'images/logos',
            platforms: 'assets/platforms',
        },
        naming: {
            template: '{name}-{width}x{height}.{format}',
            variables: {},
        },
        formats: ['png', 'webp', 'jpeg'],
    },
    assets: [
        {
            name: 'favicon-suite',
            type: 'favicon',
            source: 'icon.svg',
            variants: [
                { name: 'favicon-16x16', width: 16, height: 16, format: 'png' },
                { name: 'favicon-32x32', width: 32, height: 32, format: 'png' },
                { name: 'apple-touch-icon', width: 180, height: 180, format: 'png' },
                { name: 'android-chrome-192x192', width: 192, height: 192, format: 'png' },
                { name: 'android-chrome-512x512', width: 512, height: 512, format: 'png' },
                { name: 'mstile-150x150', width: 150, height: 150, format: 'png' },
            ],
        },
        {
            name: 'social-media',
            type: 'social',
            source: 'logo-colour-black.svg',
            variants: [
                { name: 'og-image', width: 1200, height: 630, format: 'png' },
                { name: 'twitter-card', width: 1200, height: 600, format: 'png' },
                { name: 'linkedin-share', width: 1200, height: 627, format: 'png' },
            ],
        },
        {
            name: 'logo-variants',
            type: 'logo',
            variants: [
                { name: 'logo-24', width: 24, height: 24, format: 'png' },
                { name: 'logo-32', width: 32, height: 32, format: 'png' },
                { name: 'logo-48', width: 48, height: 48, format: 'png' },
                { name: 'logo-64', width: 64, height: 64, format: 'png' },
                { name: 'logo-128', width: 128, height: 128, format: 'png' },
                { name: 'logo-256', width: 256, height: 256, format: 'png' },
            ],
        },
    ],
    processing: {
        quality: {
            png: 90,
            jpeg: 85,
            webp: 80,
            avif: 75,
        },
        optimisation: {
            progressive: true,
            optimise: true,
            lossless: false,
        },
        themes: {
            light: {
                enabled: true,
                colorTransforms: [],
            },
            dark: {
                enabled: true,
                colorTransforms: [
                    { from: '#000000', to: '#ffffff' },
                    { from: '#333333', to: '#cccccc' },
                ],
            },
            monochrome: {
                enabled: true,
                color: '#000000',
                threshold: 128,
            },
        },
        contrast: {
            enabled: true,
            threshold: 0.3,
            strokeWidth: 1,
            strokeColor: '#ffffff',
        },
    },
};
function validateConfig(config) {
    const errors = [];
    if (!config.source?.images || config.source.images.length === 0) {
        errors.push('Source images must be specified');
    }
    if (!config.output?.directory) {
        errors.push('Output directory must be specified');
    }
    if (!config.assets || config.assets.length === 0) {
        errors.push('At least one asset definition must be provided');
    }
    config.assets?.forEach((asset, index) => {
        if (!asset.name) {
            errors.push(`Asset ${index} must have a name`);
        }
        if (!asset.variants || asset.variants.length === 0) {
            errors.push(`Asset ${asset.name} must have at least one variant`);
        }
        if (asset.source && !config.source?.images.some(img => img === asset.source || img.endsWith(asset.source))) {
            errors.push(`Asset ${asset.name} references unknown source image: ${asset.source}`);
        }
        asset.variants?.forEach((variant, variantIndex) => {
            if (!variant.name) {
                errors.push(`Variant ${variantIndex} of asset ${asset.name} must have a name`);
            }
            if (!variant.format) {
                errors.push(`Variant ${variant.name} must specify a format`);
            }
        });
    });
    return errors;
}
function mergeWithDefaults(config) {
    return {
        source: {
            ...exports.DEFAULT_CONFIG.source,
            ...config.source,
        },
        output: {
            ...exports.DEFAULT_CONFIG.output,
            ...config.output,
            structure: {
                ...exports.DEFAULT_CONFIG.output.structure,
                ...config.output?.structure,
            },
            naming: {
                ...exports.DEFAULT_CONFIG.output.naming,
                ...config.output?.naming,
            },
        },
        assets: config.assets || exports.DEFAULT_CONFIG.assets,
        processing: {
            ...exports.DEFAULT_CONFIG.processing,
            ...config.processing,
            quality: {
                ...exports.DEFAULT_CONFIG.processing.quality,
                ...config.processing?.quality,
            },
            optimisation: {
                ...exports.DEFAULT_CONFIG.processing.optimisation,
                ...config.processing?.optimisation,
            },
            themes: {
                ...exports.DEFAULT_CONFIG.processing.themes,
                ...config.processing?.themes,
            },
            contrast: {
                ...exports.DEFAULT_CONFIG.processing.contrast,
                ...config.processing?.contrast,
            },
        },
        platforms: config.platforms || [],
    };
}
//# sourceMappingURL=schema.js.map