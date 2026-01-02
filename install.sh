#!/bin/bash

# Modern Mermaid - Build and Install Script
# This script builds the Electron app and installs it to ~/Applications/

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      Modern Mermaid Installer          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Use mirror for faster downloads in China
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}Error: pnpm is not installed.${NC}"
    echo "Please install pnpm first: npm install -g pnpm"
    exit 1
fi

# Step 1: Install dependencies
echo -e "${YELLOW}[1/4] Installing dependencies...${NC}"
pnpm install

# Step 2: Clean previous builds
echo -e "${YELLOW}[2/4] Cleaning previous builds...${NC}"
rm -rf dist dist-electron release

# Step 3: Build the app
echo -e "${YELLOW}[3/4] Building the application...${NC}"
ELECTRON=true pnpm vite build
pnpm electron-builder --mac --dir

# Step 4: Install to ~/Applications
echo -e "${YELLOW}[4/4] Installing to ~/Applications/...${NC}"

APP_NAME="Modern Mermaid.app"
# Check for arm64 or x64 build
if [ -d "release/mac-arm64/${APP_NAME}" ]; then
    SOURCE_APP="release/mac-arm64/${APP_NAME}"
elif [ -d "release/mac/${APP_NAME}" ]; then
    SOURCE_APP="release/mac/${APP_NAME}"
else
    echo -e "${RED}Error: Build failed. App not found.${NC}"
    exit 1
fi

DEST_DIR="${HOME}/Applications"
DEST_APP="${DEST_DIR}/${APP_NAME}"

# Create ~/Applications if it doesn't exist
mkdir -p "$DEST_DIR"

# Remove old installation if exists
if [ -d "$DEST_APP" ]; then
    echo -e "${YELLOW}Removing previous installation...${NC}"
    rm -rf "$DEST_APP"
fi

# Copy new app
cp -R "$SOURCE_APP" "$DEST_DIR/"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Installation Complete! ✓          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "App installed to: ${BLUE}${DEST_APP}${NC}"
echo ""
echo -e "To launch the app:"
echo -e "  • Open Finder → Go → Applications (your home folder)"
echo -e "  • Or run: ${BLUE}open \"${DEST_APP}\"${NC}"
echo ""

# Ask if user wants to launch the app now
read -p "Would you like to launch Modern Mermaid now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "$DEST_APP"
fi
