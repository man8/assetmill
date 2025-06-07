# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Improved release workflow with better automation and validation

### Fixed
- Fixed npx installation failing due to missing dist folder in published package (improved release validation and process)

## [0.2.1] - 2025-06-06

### Fixed
- CLI version command now dynamically reads version from package.json instead of hardcoded value
- Resolves version mismatch where CLI showed 0.0.1 while package was 0.2.0

## [0.2.0] - 2025-06-06

### Added
- npm publishing configuration for public registry
- Automated release workflow via GitHub Actions
- Updated installation instructions for npm package
- Changed package name to @man8/assetmill to match scoped npm token

## [0.1.0] - 2025-06-06

### Added
- Initial release of AssetMill brand asset pipeline CLI tool
- Comprehensive image asset generation for web applications
- Support for favicon generation (multiple sizes and formats)
- Social media asset generation (Open Graph, Twitter, LinkedIn, Facebook)
- Logo variant generation with theme support (light, dark, monochrome)
- Platform-specific asset generation (iOS, Android, Windows)
- Custom asset definition support via configuration
- Multiple output formats: PNG, JPEG, WebP, AVIF, ICO
- Configurable image processing options (quality, compression, themes)
- Dry-run mode for previewing asset generation
- Comprehensive validation of source images and configuration
- Automatic manifest file generation (site.webmanifest, browserconfig.xml)
- HTML tag generation for easy integration
- TypeScript support with full type definitions
- Comprehensive test suite with 95%+ coverage
- ESLint and Prettier configuration for code quality
- MIT licence for open source usage

### Features
- **CLI Commands**: `init`, `generate`, `validate`
- **Asset Types**: Favicons, social media images, logos, platform-specific assets
- **Image Formats**: PNG, JPEG, WebP, AVIF, ICO
- **Theme Support**: Light, dark, and monochrome variants
- **Configuration**: Flexible YAML-based configuration system
- **Validation**: Comprehensive input validation and error handling
- **Performance**: Optimised image processing with Sharp
- **Documentation**: Comprehensive README with examples and API reference

### Technical Details
- Built with TypeScript for type safety
- Uses Sharp for high-performance image processing
- Supports Node.js 18.0.0 and higher
- Comprehensive error handling and logging
- Modular architecture for extensibility
- Full test coverage with Jest
- GitHub Actions CI/CD pipeline

### Fixed
- Dry-run functionality now properly simulates asset generation based on configuration instead of using hardcoded values
