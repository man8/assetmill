# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

* improved error reporting and validation for YAML configuration files
* clear error messages when configuration files are missing or invalid
* detailed YAML parsing errors with line and column numbers
* better file system error handling with helpful guidance
* actionable error messages that explain how to fix configuration issues

### Documentation

* clarified that margin settings only apply to raster output formats (PNG, JPEG, WebP, AVIF, ICO) and are ignored for SVG output due to technical limitations

### Fixed
- Fixed misleading output messages in --dry-run mode to clearly differentiate between simulation and actual execution
- Fixed monochrome + background combination producing completely white output instead of monochrome logo on coloured background
## [0.3.0](https://github.com/man8/assetmill/compare/v0.2.1...v0.3.0) (2025-06-07)


### Added

* add build step to prepublishOnly script ([#13](https://github.com/man8/assetmill/issues/13)) ([f7ece27](https://github.com/man8/assetmill/commit/f7ece27fa5e920f9fab3d764a5237007a81b848e))
* implement overwrite control feature (MAN8-4764) ([#16](https://github.com/man8/assetmill/issues/16)) ([63bd189](https://github.com/man8/assetmill/commit/63bd18971ddf8ad18dfc6360d8c432ace7e0c85b))
* **release:** automate changelog management and version workflows ([638fe0b](https://github.com/man8/assetmill/commit/638fe0b1290ecf2f3ddd356224c8562a3375958f))
* **release:** migrate to commit-and-tag-version for automated release management ([8e75db7](https://github.com/man8/assetmill/commit/8e75db72fb0ea33d813bde7c969fb7c5c31fee90))


### Fixed

* upgrade Sharp to 0.34.2 for ARM64 macOS compatibility ([6e7983d](https://github.com/man8/assetmill/commit/6e7983d5677c40899b021f8bef957008cdb74264))


### Changed

* clean-up ([eb9edb9](https://github.com/man8/assetmill/commit/eb9edb970b84e6872083b77cc5f5a495261f5c97))
* enhance README with tool intent ([#18](https://github.com/man8/assetmill/issues/18)) ([f019f22](https://github.com/man8/assetmill/commit/f019f22bae6af08bc97ca23e5b4e5388d23f89ef))
* extract helper methods from complex ImageProcessor methods ([#15](https://github.com/man8/assetmill/issues/15)) ([b4c591e](https://github.com/man8/assetmill/commit/b4c591e006dbe390768b922ac57f8bf454bc263c))

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
- Initial release of assetmill brand asset pipeline CLI tool
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
