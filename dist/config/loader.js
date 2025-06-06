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
exports.ConfigLoader = void 0;
const fs = __importStar(require("fs-extra"));
const yaml = __importStar(require("js-yaml"));
const path_1 = __importDefault(require("path"));
const schema_1 = require("./schema");
class ConfigLoader {
    static async load(configPath) {
        try {
            const configFile = await fs.readFile(configPath, 'utf8');
            const rawConfig = yaml.load(configFile);
            const errors = (0, schema_1.validateConfig)(rawConfig);
            if (errors.length > 0) {
                throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
            }
            const config = (0, schema_1.mergeWithDefaults)(rawConfig);
            const configDir = path_1.default.dirname(path_1.default.resolve(configPath));
            if (config.output.directory && !path_1.default.isAbsolute(config.output.directory)) {
                config.output.directory = path_1.default.resolve(process.cwd(), config.output.directory);
            }
            config.source.images = config.source.images.map(imagePath => {
                if (!path_1.default.isAbsolute(imagePath)) {
                    return path_1.default.resolve(configDir, imagePath);
                }
                return imagePath;
            });
            return config;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to load configuration from ${configPath}: ${error.message}`);
            }
            throw error;
        }
    }
    static async generateTemplate(outputPath) {
        const templateConfig = {
            source: {
                images: ['logo.svg'],
                formats: ['png'],
                validation: {
                    minWidth: 512,
                    minHeight: 512,
                    maxFileSize: '50MB',
                    requireTransparency: true,
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
                },
                formats: ['png', 'webp', 'jpeg'],
            },
            assets: [
                {
                    name: 'favicon-suite',
                    type: 'favicon',
                    outputPath: 'public/favicon/',
                    variants: [
                        { name: 'favicon-16x16', width: 16, height: 16, format: 'png' },
                        { name: 'favicon-32x32', width: 32, height: 32, format: 'png' },
                        { name: 'apple-touch-icon', width: 180, height: 180, format: 'png' },
                        { name: 'android-chrome-192x192', width: 192, height: 192, format: 'png' },
                        { name: 'android-chrome-512x512', width: 512, height: 512, format: 'png' },
                    ],
                },
                {
                    name: 'social-media',
                    type: 'social',
                    outputPath: 'assets/social/',
                    variants: [
                        { name: 'og-image', width: 1200, height: 630, format: 'png' },
                        { name: 'twitter-card', width: 1200, height: 600, format: 'png' },
                        { name: 'linkedin-share', width: 1200, height: 627, format: 'png' },
                    ],
                },
                {
                    name: 'logo-variants',
                    type: 'logo',
                    outputPath: 'images/logos/',
                    variants: [
                        { name: 'logo-24', width: 24, height: 24, format: 'png' },
                        { name: 'logo-48', width: 48, height: 48, format: 'png' },
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
                },
                themes: {
                    light: { enabled: true },
                    dark: {
                        enabled: true,
                        colorTransforms: [
                            { from: '#000000', to: '#ffffff' },
                        ],
                    },
                    monochrome: { enabled: false },
                },
                contrast: {
                    enabled: true,
                    threshold: 0.3,
                    strokeWidth: 1,
                    strokeColor: '#ffffff',
                },
            },
            platforms: [
                {
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
                },
                {
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
                },
            ],
        };
        const yamlContent = yaml.dump(templateConfig, {
            indent: 2,
            lineWidth: 119,
            noRefs: true,
        });
        await fs.writeFile(outputPath, yamlContent, 'utf8');
    }
    static findConfigFile(startDir = process.cwd()) {
        const configNames = ['test-config.yml', 'config.yml', 'config.yaml', 'assetmill.yml', 'assetmill.yaml'];
        let currentDir = startDir;
        while (currentDir !== path_1.default.dirname(currentDir)) {
            for (const configName of configNames) {
                const configPath = path_1.default.join(currentDir, configName);
                if (fs.existsSync(configPath)) {
                    return configPath;
                }
            }
            currentDir = path_1.default.dirname(currentDir);
        }
        return null;
    }
}
exports.ConfigLoader = ConfigLoader;
//# sourceMappingURL=loader.js.map