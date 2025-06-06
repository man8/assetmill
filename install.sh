#!/bin/bash
set -e


VERSION=${1:-latest}
REPO="man8/assetmill"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

if [ "$VERSION" = "latest" ]; then
    VERSION=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | \
        grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
fi

echo "Installing assetmill $VERSION..."

DOWNLOAD_URL="https://api.github.com/repos/$REPO/releases/tags/$VERSION"
ASSET_URL=$(curl -s "$DOWNLOAD_URL" | \
    grep '"browser_download_url":.*\.tar\.gz"' | \
    sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$ASSET_URL" ]; then
    echo "Error: Could not find release asset for version $VERSION"
    exit 1
fi

TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

curl -L "$ASSET_URL" -o assetmill.tar.gz
npm install -g assetmill.tar.gz

echo "assetmill $VERSION installed successfully!"
echo "Run 'assetmill --help' to get started."

cd /
rm -rf "$TMP_DIR"
