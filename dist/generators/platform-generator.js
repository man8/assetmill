"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformGenerator = void 0;
const path_1 = __importDefault(require("path"));
const image_processor_1 = require("../processors/image-processor");
class PlatformGenerator {
    static async generate(sourceImage, config, outputDir) {
        const assets = [];
        if (!config.platforms || config.platforms.length === 0) {
            return assets;
        }
        const platformsDir = path_1.default.join(outputDir, config.output.structure.platforms);
        for (const platform of config.platforms) {
            const platformAssets = await this.generatePlatformAssets(sourceImage, platform, platformsDir, config);
            assets.push(...platformAssets);
        }
        return assets;
    }
    static async generatePlatformAssets(sourceImage, platform, platformsDir, config) {
        const assets = [];
        const platformDir = path_1.default.join(platformsDir, platform.name);
        for (const assetDef of platform.assets) {
            for (const variant of assetDef.variants) {
                const outputPath = path_1.default.join(platformDir, `${variant.name}.${variant.format}`);
                const processedAsset = await image_processor_1.ImageProcessor.processImage(sourceImage, variant, outputPath, {
                    quality: variant.quality ||
                        config.processing.quality[variant.format],
                    background: variant.background,
                    margin: variant.margin,
                }, config);
                assets.push(processedAsset);
            }
        }
        return assets;
    }
    static getGoogleWorkspaceConfig() {
        return {
            name: 'google-workspace',
            assets: [
                {
                    name: 'profile-image',
                    type: 'platform-specific',
                    variants: [
                        {
                            name: 'google-workspace-profile',
                            width: 512,
                            height: 512,
                            format: 'png',
                            margin: { all: '20%' },
                            background: '#ffffff',
                        },
                    ],
                },
            ],
            requirements: {
                margin: { all: '20%' },
                background: '#ffffff',
                aspectRatio: 1,
                maxSize: 1024,
                formats: ['png'],
            },
        };
    }
    static getSlackConfig() {
        return {
            name: 'slack',
            assets: [
                {
                    name: 'workspace-logo',
                    type: 'platform-specific',
                    variants: [
                        {
                            name: 'slack-logo',
                            width: 512,
                            height: 512,
                            format: 'png',
                            margin: { all: '15%' },
                        },
                    ],
                },
            ],
            requirements: {
                margin: { all: '15%' },
                aspectRatio: 1,
                maxSize: 2048,
                formats: ['png', 'jpeg'],
            },
        };
    }
    static getDiscordConfig() {
        return {
            name: 'discord',
            assets: [
                {
                    name: 'server-icon',
                    type: 'platform-specific',
                    variants: [
                        {
                            name: 'discord-server-icon',
                            width: 512,
                            height: 512,
                            format: 'png',
                            margin: { all: '10%' },
                        },
                    ],
                },
            ],
            requirements: {
                margin: { all: '10%' },
                aspectRatio: 1,
                maxSize: 1024,
                formats: ['png', 'jpeg'],
            },
        };
    }
    static getGitHubConfig() {
        return {
            name: 'github',
            assets: [
                {
                    name: 'organization-avatar',
                    type: 'platform-specific',
                    variants: [
                        {
                            name: 'github-org-avatar',
                            width: 512,
                            height: 512,
                            format: 'png',
                            margin: { all: '12%' },
                        },
                    ],
                },
            ],
            requirements: {
                margin: { all: '12%' },
                aspectRatio: 1,
                maxSize: 1024,
                formats: ['png'],
            },
        };
    }
}
exports.PlatformGenerator = PlatformGenerator;
//# sourceMappingURL=platform-generator.js.map