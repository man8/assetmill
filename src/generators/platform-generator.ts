import path from 'path';
import { ImageProcessor } from '../processors/image-processor';
import { SourceImage, GeneratedAsset, PipelineConfig, PlatformConfig } from '../types';

export class PlatformGenerator {
  static async generate(
    sourceImage: SourceImage,
    config: PipelineConfig,
    outputDir: string
  ): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];

    if (!config.platforms || config.platforms.length === 0) {
      return assets;
    }

    const platformsDir = path.join(outputDir, config.output.structure.platforms);

    for (const platform of config.platforms) {
      const platformAssets = await this.generatePlatformAssets(sourceImage, platform, platformsDir, config);
      assets.push(...platformAssets);
    }

    return assets;
  }

  private static async generatePlatformAssets(
    sourceImage: SourceImage,
    platform: PlatformConfig,
    platformsDir: string,
    config: PipelineConfig
  ): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];
    const platformDir = path.join(platformsDir, platform.name);

    for (const assetDef of platform.assets) {
      for (const variant of assetDef.variants) {
        const outputPath = path.join(platformDir, `${variant.name}.${variant.format}`);

        const processedAsset = await ImageProcessor.processImage(sourceImage, variant, outputPath, {
          quality: variant.quality || 
            config.processing.quality[variant.format as keyof typeof config.processing.quality],
          background: variant.background,
          margin: variant.margin,
          overwriteMode: variant.overwrite || config.output.overwrite,
        }, config);

        assets.push(processedAsset);
      }
    }

    return assets;
  }

  static getGoogleWorkspaceConfig(): PlatformConfig {
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

  static getSlackConfig(): PlatformConfig {
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

  static getDiscordConfig(): PlatformConfig {
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

  static getGitHubConfig(): PlatformConfig {
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
