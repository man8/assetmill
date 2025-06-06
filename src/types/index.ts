export interface AssetConfig {
  name: string;
  width?: number;
  height?: number;
  format: OutputFormat;
  quality?: number;
  background?: string;
  margin?: MarginConfig;
  theme?: ThemeVariant;
  platform?: PlatformType;
}

export interface MarginConfig {
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
  horizontal?: number | string;
  vertical?: number | string;
  all?: number | string;
}

export interface SourceImage {
  path: string;
  format: InputFormat;
  width: number;
  height: number;
}

export interface ProcessingOptions {
  quality?: number;
  progressive?: boolean;
  optimise?: boolean;
  background?: string;
  margin?: MarginConfig;
  theme?: ThemeVariant;
  overwriteMode?: OverwriteMode;
}

export interface GeneratedAsset {
  name: string;
  path: string;
  format: OutputFormat;
  width: number;
  height: number;
  fileSize: number;
  optimised: boolean;
}

export interface PipelineConfig {
  source: SourceConfig;
  output: OutputConfig;
  assets: AssetDefinition[];
  processing: ProcessingConfig;
  platforms?: PlatformConfig[];
}

export interface SourceConfig {
  images: string[];
  formats: InputFormat[];
  validation: ValidationConfig;
  defaults?: SourceDefaults;
}

export interface SourceDefaults {
  favicon?: boolean;
  social?: boolean;
  logos?: boolean;
  platforms?: boolean;
}

export interface OutputConfig {
  directory: string;
  structure: DirectoryStructure;
  naming: NamingConfig;
  formats: OutputFormat[];
  overwrite: OverwriteMode;
}

export interface AssetDefinition {
  name: string;
  type: AssetType;
  variants: AssetVariant[];
  outputPath?: string;
  source?: string;
}

export interface AssetVariant {
  name: string;
  width?: number;
  height?: number;
  format: OutputFormat;
  quality?: number;
  margin?: MarginConfig;
  theme?: ThemeVariant;
  background?: string;
  monochrome?: string | MonochromeConfig;
  simplified?: boolean;
  viewBox?: string;
  preserveAspectRatio?: string;
  colorTransforms?: ColorTransform[];
  sizes?: number[];
  svg?: SvgConfig;
  overwrite?: OverwriteMode;
}

export interface ProcessingConfig {
  quality: QualityConfig;
  optimisation: OptimisationConfig;
  themes: ThemeConfig;
  contrast: ContrastConfig;
}

export interface PlatformConfig {
  name: PlatformType;
  assets: AssetDefinition[];
  requirements: PlatformRequirements;
}

export interface PlatformRequirements {
  margin?: MarginConfig;
  background?: string;
  aspectRatio?: number;
  maxSize?: number;
  formats?: OutputFormat[];
}

export interface ValidationConfig {
  minWidth: number;
  minHeight: number;
  maxFileSize: number;
  requireTransparency: boolean;
}

export interface DirectoryStructure {
  favicon: string;
  social: string;
  logos: string;
  platforms: string;
}

export interface NamingConfig {
  template: string;
  variables: Record<string, string>;
}

export interface QualityConfig {
  png: number;
  jpeg: number;
  webp: number;
  avif: number;
  svg: number;
}

export interface OptimisationConfig {
  progressive: boolean;
  optimise: boolean;
  lossless: boolean;
}

export interface ThemeConfig {
  light: ThemeSettings;
  dark: ThemeSettings;
  monochrome: ThemeSettings;
}

export interface ThemeSettings {
  enabled: boolean;
  colorTransforms?: ColorTransform[];
  color?: string;
  threshold?: number;
  background?: string;
}

export interface ColorTransform {
  from: string;
  to: string;
}

export interface ContrastConfig {
  enabled: boolean;
  threshold: number;
  strokeWidth: number;
  strokeColor: string;
}

export interface MonochromeConfig {
  color?: string;
  threshold?: number;
}

export type InputFormat = 'svg' | 'png' | 'jpeg' | 'jpg';
export type OutputFormat = 'png' | 'jpeg' | 'webp' | 'avif' | 'ico' | 'svg';
export type ThemeVariant = 'light' | 'dark' | 'monochrome' | 'high-contrast';
export type AssetType = 'favicon' | 'social' | 'logo' | 'platform-specific';
export type PlatformType = 'google-workspace' | 'slack' | 'discord' | 'github' | 'twitter' | 'linkedin' | 'facebook';
export type OverwriteMode = 'allow' | 'warn' | 'error';

export interface ProcessingResult {
  success: boolean;
  assets: GeneratedAsset[];
  errors: ProcessingError[];
  metrics: ProcessingMetrics;
}

export interface ProcessingError {
  message: string;
  file?: string;
  code?: string;
}

export interface ProcessingMetrics {
  totalAssets: number;
  successfulAssets: number;
  failedAssets: number;
  totalFileSize: number;
  processingTime: number;
}

export interface SvgConfig {
  monochrome?: string;
  simplified?: boolean;
  colorScheme?: 'light' | 'dark';
  viewBox?: string;
  preserveAspectRatio?: string;
  colorTransforms?: ColorTransform[];
}

export interface CLIOptions {
  config?: string;
  output?: string;
  dryRun?: boolean;
  verbose?: boolean;
  force?: boolean;
  quality?: number;
  format?: OutputFormat[];
}
