#!/bin/bash
set -e


VERSION=${1:-latest}
REPO="man8/assetmill"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is required for accessing private releases"
    echo "Please set your GitHub personal access token with repo access:"
    echo "export GITHUB_TOKEN=your_token_here"
    exit 1
fi

if [ "$VERSION" = "latest" ]; then
    VERSION=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/$REPO/releases/latest" | \
        grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
fi

echo "Installing assetmill $VERSION..."

DOWNLOAD_URL="https://api.github.com/repos/$REPO/releases/tags/$VERSION"
ASSET_URL=$(curl -s -H "Authorization: token $GITHUB_TOKEN" "$DOWNLOAD_URL" | \
    grep '"browser_download_url":.*\.tar\.gz"' | \
    sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$ASSET_URL" ]; then
    echo "Error: Could not find release asset for version $VERSION"
    exit 1
fi

TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

curl -L -H "Authorization: token $GITHUB_TOKEN" "$ASSET_URL" -o assetmill.tar.gz
npm install -g assetmill.tar.gz

echo "assetmill $VERSION installed successfully!"
echo "Run 'assetmill --help' to get started."

cd /
rm -rf "$TMP_DIR"
