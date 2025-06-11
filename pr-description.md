# Document SVG margin limitations

## Summary

This PR adds documentation to clarify that margin settings only apply to raster output formats (PNG, JPEG, WebP, AVIF, ICO) and are ignored for SVG output.

## Changes

### README.md
- Enhanced the "Margin Handling" section to explicitly state that margins are not supported for SVG output
- Added technical explanation: SVG processing uses markup transformation rather than canvas manipulation
- Included comparative examples showing margin behaviour for PNG vs SVG formats

### CHANGELOG.md
- Added documentation entry explaining the margin limitation clarification

## Background

Users may expect margin settings to work consistently across all output formats, but the current implementation only supports margins for raster formats. SVG output bypasses the margin processing pipeline entirely because it uses SVGO for markup transformation rather than Sharp.js for canvas manipulation.

This documentation update helps users understand why their margin settings don't affect SVG output and provides guidance on format selection when margins are required.

## Testing

- [x] Documentation changes reviewed for clarity and accuracy
- [x] Examples tested to ensure they reflect actual behaviour
- [x] Changelog entry follows project conventions

---

**Link to Devin run**: https://app.devin.ai/sessions/b425ede537fd479d8c6ce16d105c5fdf  
**Requested by**: Louis Mandelstam (louis@man8.com)
