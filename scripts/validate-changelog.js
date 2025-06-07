#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const CHANGELOG_PATH = path.join(__dirname, '../CHANGELOG.md');

function validateChangelog() {
    if (!fs.existsSync(CHANGELOG_PATH)) {
        console.error('❌ CHANGELOG.md not found');
        return false;
    }

    const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    let isValid = true;
    const errors = [];

    // Check for required header
    if (!changelog.includes('# Changelog')) {
        errors.push('Missing main "# Changelog" header');
        isValid = false;
    }

    // Check for Keep a Changelog reference
    if (!changelog.includes('Keep a Changelog')) {
        errors.push('Missing reference to Keep a Changelog format');
        isValid = false;
    }

    // Check for Semantic Versioning reference
    if (!changelog.includes('Semantic Versioning')) {
        errors.push('Missing reference to Semantic Versioning');
        isValid = false;
    }

    // Check for Unreleased section
    if (!changelog.includes('## [Unreleased]')) {
        errors.push('Missing "## [Unreleased]" section');
        isValid = false;
    }

    // Validate version format (should match semantic versioning)
    const versionRegex = /## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})/g;
    const versions = [];
    let match;

    while ((match = versionRegex.exec(changelog)) !== null) {
        versions.push({
            version: match[1],
            date: match[2]
        });
    }

    // Check if versions are in descending order
    for (let i = 0; i < versions.length - 1; i++) {
        const current = versions[i].version.split('.').map(Number);
        const next = versions[i + 1].version.split('.').map(Number);

        const currentValue = current[0] * 10000 + current[1] * 100 + current[2];
        const nextValue = next[0] * 10000 + next[1] * 100 + next[2];

        if (currentValue <= nextValue) {
            errors.push(`Version ${versions[i].version} should be higher than ${versions[i + 1].version}`);
            isValid = false;
        }
    }

    // Check for valid date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    versions.forEach(v => {
        if (!dateRegex.test(v.date)) {
            errors.push(`Invalid date format for version ${v.version}: ${v.date} (should be YYYY-MM-DD)`);
            isValid = false;
        }
    });

    // Check for standard sections in recent entries
    const standardSections = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];
    const recentVersions = versions.slice(0, Math.min(3, versions.length));

    recentVersions.forEach(v => {
        const versionSection = changelog.match(new RegExp(`## \\[${v.version}\\][\\s\\S]*?(?=## \\[|$)`));
        if (versionSection) {
            const hasStandardSection = standardSections.some(section =>
                versionSection[0].includes(`### ${section}`)
            );
            if (!hasStandardSection) {
                console.warn(`⚠️  Version ${v.version} doesn't use standard sections (Added, Changed, Fixed, etc.)`);
            }
        }
    });

    if (isValid) {
        console.log('✅ CHANGELOG.md validation passed');
        console.log(`   Found ${versions.length} version entries`);
        if (versions.length > 0) {
            console.log(`   Latest version: ${versions[0].version} (${versions[0].date})`);
        }
    } else {
        console.error('❌ CHANGELOG.md validation failed:');
        errors.forEach(error => console.error(`   • ${error}`));
    }

    return isValid;
}

function checkUnreleasedContent() {
    const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    const unreleasedMatch = changelog.match(/## \[Unreleased\]\s*\n([\s\S]*?)(?=\n## \[|\n$)/);

    if (!unreleasedMatch || !unreleasedMatch[1].trim()) {
        console.log('ℹ️  No unreleased changes found');
        console.log('   Add your changes to the [Unreleased] section before releasing');
        return false;
    } else {
        console.log('✅ Unreleased changes found and ready for next release');
        return true;
    }
}

if (require.main === module) {
    const isValid = validateChangelog();
    console.log('');
    checkUnreleasedContent();

    process.exit(isValid ? 0 : 1);
}

module.exports = { validateChangelog, checkUnreleasedContent };