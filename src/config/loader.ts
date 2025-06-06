import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import path from 'path';
import { PipelineConfig } from '../types';
import { validateConfig, mergeWithDefaults } from './schema';

export class ConfigLoader {
  static async load(configPath: string): Promise<PipelineConfig> {
    try {
      const configFile = await fs.readFile(configPath, 'utf8');
      const rawConfig = yaml.load(configFile) as Partial<PipelineConfig>;

      const errors = validateConfig(rawConfig);
      if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
      }

      const config = mergeWithDefaults(rawConfig);
      
      const configDir = path.dirname(path.resolve(configPath));
      
      if (config.output.directory && !path.isAbsolute(config.output.directory)) {
        config.output.directory = path.resolve(configDir, config.output.directory);
      }
      
      config.source.images = config.source.images.map(imagePath => {
        if (!path.isAbsolute(imagePath)) {
          return path.resolve(configDir, imagePath);
        }
        return imagePath;
      });

      return config;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load configuration from ${configPath}: ${error.message}`);
      }
      throw error;
    }
  }

  static async generateTemplate(outputPath: string): Promise<void> {
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

  static findConfigFile(startDir: string = process.cwd()): string | null {
    const configNames = ['test-config.yml', 'config.yml', 'config.yaml', 'assetmill.yml', 'assetmill.yaml'];

    let currentDir = startDir;
    while (currentDir !== path.dirname(currentDir)) {
      for (const configName of configNames) {
        const configPath = path.join(currentDir, configName);
        if (fs.existsSync(configPath)) {
          return configPath;
        }
      }
      currentDir = path.dirname(currentDir);
    }

    return null;
  }
}
