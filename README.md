# assetmill

A powerful command-line tool for automated image asset processing and optimization. Generate multiple sizes, formats, and variants from source images with consistent quality and specifications.

## Features

- **Multi-format Support**: Process SVG, PNG, and JPEG source images; output PNG, JPEG, WebP, AVIF, ICO, and SVG formats
- **Comprehensive Asset Generation**: Favicons, social media images, responsive images, and platform-specific assets
- **Theme Variants**: Automatic generation of light, dark, and monochrome versions
- **Platform Optimisation**: Built-in presets for Google Workspace, Slack, Discord, GitHub, and more
- **Flexible Configuration**: YAML-based configuration with CLI overrides
- **CI/CD Ready**: Perfect for automated build pipelines
- **Performance Optimised**: Concurrent processing and intelligent quality settings

## Installation

### Global Installation
```bash
npm install -g assetmill
```

### Using npx (no installation required)
```bash
npx assetmill --help
```

### Local Development
```bash
npm install assetmill
npx assetmill --help
```

## Quick Start

1. **Initialise a new project**:
   ```bash
   assetmill init
   ```

2. **Place your source image** (e.g., `logo.svg`) in the current directory

3. **Generate assets**:
   ```bash
   assetmill generate
   ```

## Usage

### Commands

#### `init`
Create a new configuration file with sensible defaults:

```bash
assetmill init [options]

Options:
  -o, --output <path>  Output path for configuration file (default: "config.yml")
  -f, --force          Overwrite existing configuration file
```

#### `generate`
Generate image assets from source images:

```bash
assetmill generate [options]

Options:
  -c, --config <path>     Path to configuration file (default: "config.yml")
  -o, --output <path>     Output directory (overrides config)
  -d, --dry-run           Preview operations without generating files
  -v, --verbose           Enable verbose logging
  -f, --force             Overwrite existing files
  -q, --quality <number>  Override quality setting (1-100)
  --format <formats...>   Override output formats (png,jpeg,webp,avif,ico)
```

#### `validate`
Validate configuration and source images:

```bash
assetmill validate [options]

Options:
  -c, --config <path>  Path to configuration file (default: "config.yml")
  -v, --verbose        Enable verbose logging
```

### Configuration

The tool uses a YAML configuration file to define source images, output settings, and asset specifications. Here's a basic example:

```yaml
source:
  images:
    - logo.svg
  formats:
    - svg
    - png
  validation:
    minWidth: 512
    minHeight: 512
    maxFileSize: 50MB
    requireTransparency: true

output:
  directory: ./assets
  structure:
    favicon: public/favicon
    social: assets/social
    logos: images/logos
    platforms: assets/platforms
  formats:
    - png
    - webp
    - jpeg
    - avif
    - ico

assets:
  - name: favicon-suite
    type: favicon
    outputPath: public/favicon/
    variants:
      - name: favicon-16x16
        width: 16
        height: 16
        format: png
      - name: favicon-32x32
        width: 32
        height: 32
        format: png
      - name: apple-touch-icon
        width: 180
        height: 180
        format: png

processing:
  quality:
    png: 90
    jpeg: 85
    webp: 80
    avif: 75
  themes:
    light:
      enabled: true
    dark:
      enabled: true
      colorTransforms:
        - from: "#000000"
          to: "#ffffff"
```

### Platform-Specific Assets

Generate assets optimised for specific platforms:

```yaml
platforms:
  - name: google-workspace
    assets:
      - name: profile-image
        type: platform-specific
        variants:
          - name: google-workspace-profile
            width: 512
            height: 512
            format: png
            margin:
              all: "20%"
            background: "#ffffff"

  - name: slack
    assets:
      - name: workspace-logo
        type: platform-specific
        variants:
          - name: slack-logo
            width: 512
            height: 512
            format: png
            margin:
              all: "15%"
```

### Image Processing Behaviour

The assetmill tool preserves image quality and proportions through intelligent processing:

#### Aspect Ratio Preservation
- **Images are never stretched or distorted** - original proportions are always maintained
- When both width and height are specified, the image is scaled to fit within those dimensions
- **Automatic transparent margins** are added when the requested dimensions don't match the source aspect ratio
- This ensures consistent visual quality across all generated assets

#### Background Colour
- **Transparent backgrounds** are preserved by default
- Specify a background colour to fill transparent areas with a solid colour
- Supports hex colour strings (e.g., "#ffffff" for white, "#ff0000" for red)
- Particularly useful for Apple touch icons and other assets that require opaque backgrounds

```yaml
variants:
  - name: apple-touch-icon
    width: 180
    height: 180
    format: png
    background: "#ffffff"  # Creates white background instead of transparency
```

#### Margin Handling
- **Margins are included within the requested dimensions** - not added on top
- When margins are specified, the image is scaled to fit within the content area (total dimensions minus margins)
- Transparent margins are then added to reach the exact requested dimensions
- This ensures output files match the specified width and height exactly

```yaml
variants:
  - name: icon-with-margin
    width: 100
    height: 100
    format: png
    margin:
      all: "10%"    # Image scaled to 80x80, then 10px margins added to reach 100x100
```

#### Resizing Behaviour
```yaml
variants:
  - name: square-icon
    width: 512
    height: 512    # If source is rectangular, transparent margins added to make square
    format: png

  - name: proportional-resize
    height: 120    # Width calculated automatically to maintain aspect ratio
    format: png
```

#### Theme Processing
The tool supports multiple theme variants for generating different colour versions:

```yaml
# Global theme configuration
processing:
  themes:
    light:
      enabled: true
    dark:
      enabled: true
    monochrome:
      enabled: true
      color: "#000000"
      threshold: 128

# Per-variant theme configuration
variants:
  - name: icon
    monochrome: "#ffffff"  # Simple colour specification
    # OR
    monochrome:
      color: "#ffffff"
      threshold: 128  # Configurable threshold (0-255)
```

**Monochrome Theme Options**:
- **Simple syntax**: `monochrome: "#ffffff"` for white monochrome
- **Advanced syntax**: `monochrome: { color: "#ffffff", threshold: 128 }` for custom threshold
- **Threshold**: Controls the greyscale-to-monochrome conversion point (0-255)
- **Colour support**: Any hex colour for monochrome output

#### Examples
- **Source**: 800x600 image (4:3 ratio)
- **Requested**: 512x512 (1:1 ratio)
- **Result**: Image scaled to 512x384, centred in 512x512 canvas with transparent margins
- **With 10% margin**: Image scaled to ~410x307, centred in 512x512 canvas with 51px margins

### Margin and Padding

Control spacing around your images:

```yaml
margin:
  all: "20%"           # 20% margin on all sides
  horizontal: "15%"    # 15% margin left and right
  vertical: "10%"      # 10% margin top and bottom
  top: 50              # 50 pixels top margin
  right: "5%"          # 5% right margin
  bottom: 30           # 30 pixels bottom margin
  left: "8%"           # 8% left margin
```

### Theme Variants

Automatically generate theme-appropriate versions:

```yaml
processing:
  themes:
    light:
      enabled: true
    dark:
      enabled: true
      colorTransforms:
        - from: "#000000"
          to: "#ffffff"
        - from: "#333333"
          to: "#cccccc"
    monochrome:
      enabled: true
```

## Generated Assets

### Favicon Suite
- `favicon.ico` (multi-size: 16x16, 32x32, configurable sizes)
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png` (180x180, with opaque background)
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`
- `mstile-150x150.png` (with monochrome theme support)

#### ICO Files with Multiple Sizes
```yaml
variants:
  - name: favicon
    format: ico
    sizes: [16, 32, 48, 64]  # Custom sizes array
```

#### Background Parameter
```yaml
variants:
  - name: apple-touch-icon
    width: 180
    height: 180
    format: png
    background: "#ffffff"  # Creates opaque white background
```

### Social Media Assets
- Open Graph image (1200x630)
- Twitter Card image (1200x600)
- LinkedIn share image (1200x627)

### Responsive Images
- Standard sizes: 320w, 640w, 768w, 1024w, 1280w, 1920w
- Multiple formats for each size (WebP, AVIF, original format)

### Manifest Files
- `site.webmanifest` - Web app manifest
- `browserconfig.xml` - Microsoft browser configuration
- `favicon-tags.html` - HTML tags for favicon integration
- `social-meta-tags.html` - Social media meta tags

## API Usage

You can also use the tool programmatically:

```typescript
import { ConfigLoader, AssetPipeline } from 'assetmill';

const config = await ConfigLoader.load('config.yml');
const pipeline = new AssetPipeline(config);
const result = await pipeline.execute();

if (result.success) {
  console.log(`Generated ${result.assets.length} assets`);
} else {
  console.error('Pipeline failed:', result.errors);
}
```

## Requirements

- Node.js 18.0.0 or higher
- Source images should be at least 512x512 pixels (for raster formats)
- SVG format is recommended for best scalability

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Feedback

We're actively working on expanding assetmill's capabilities. If you have feature requests or suggestions, please:
- 🚀 [Submit a feature request](https://github.com/man8/assetmill/issues/new?template=feature_request.md)
- 💡 [Join the discussion](https://github.com/man8/assetmill/discussions)
- 🤝 [Contribute to development](CONTRIBUTING.md)

## Support

- 📖 [Documentation](https://github.com/man8/assetmill#readme)
- 🐛 [Issue Tracker](https://github.com/man8/assetmill/issues)
- 💬 [Discussions](https://github.com/man8/assetmill/discussions)
