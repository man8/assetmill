#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const CHANGELOG_PATH = path.join(__dirname, '../CHANGELOG.md');

function getCurrentVersion() {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    return packageJson.version.replace('-dev.0', ''); // Remove dev suffix
}

function bumpVersion(version, type) {
    const [major, minor, patch] = version.split('.').map(Number);

    switch (type) {
        case 'major':
            return `${major + 1}.0.0`;
        case 'minor':
            return `${major}.${minor + 1}.0`;
        case 'patch':
        default:
            return `${major}.${minor}.${patch + 1}`;
    }
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function prepareChangelog(releaseType) {
    if (!fs.existsSync(CHANGELOG_PATH)) {
        console.error('CHANGELOG.md not found');
        process.exit(1);
    }

    const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    const currentVersion = getCurrentVersion();
    const newVersion = bumpVersion(currentVersion, releaseType);
    const today = getTodayDate();

    // Check if there's content in the Unreleased section
    const unreleasedMatch = changelog.match(/## \[Unreleased\]\s*\n([\s\S]*?)(?=\n## \[|\n$)/);

    if (!unreleasedMatch || !unreleasedMatch[1].trim()) {
        console.error('No unreleased changes found in CHANGELOG.md');
        console.log('Please add your changes to the [Unreleased] section first');
        process.exit(1);
    }

    const unreleasedContent = unreleasedMatch[1].trim();

    // Replace [Unreleased] section with new version
    const updatedChangelog = changelog.replace(
        /## \[Unreleased\]\s*\n[\s\S]*?(?=\n## \[)/,
        `## [Unreleased]\n\n## [${newVersion}] - ${today}\n\n${unreleasedContent}\n`
    );

    fs.writeFileSync(CHANGELOG_PATH, updatedChangelog);

    console.log(`✅ Prepared CHANGELOG.md for version ${newVersion}`);
    console.log(`   Moved unreleased changes to [${newVersion}] - ${today}`);

    return newVersion;
}

if (require.main === module) {
    const releaseType = process.argv[2] || 'patch';

    if (!['major', 'minor', 'patch'].includes(releaseType)) {
        console.error('Usage: node prepare-changelog.js [major|minor|patch]');
        process.exit(1);
    }

    prepareChangelog(releaseType);
}

module.exports = { prepareChangelog };