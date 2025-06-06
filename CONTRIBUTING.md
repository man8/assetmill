# Contributing to AssetMill

Thank you for your interest in contributing to AssetMill! This document provides guidelines for contributing to the project.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/man8/assetmill.git
   cd assetmill
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style and conventions
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run build
   npm test
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style

- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Use British English for documentation and user-facing strings
- Maximum line length: 119 characters
- Add proper JSDoc documentation for all public functions and classes

## Testing

- Write unit tests for new functionality
- Ensure all tests pass before submitting
- Aim for good test coverage of new code
- Test with multiple Node.js versions (18, 20, 22)

## Documentation

- Update README.md if adding new features
- Use British English spelling and terminology
- Include code examples where appropriate
- Update CHANGELOG.md for significant changes

## Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Ensure CI checks pass
- Be responsive to feedback and review comments

## Reporting Issues

When reporting issues, please include:
- Node.js version
- Operating system
- Steps to reproduce
- Expected vs actual behaviour
- Any relevant configuration files

## Questions?

If you have questions about contributing, please open an issue for discussion.
