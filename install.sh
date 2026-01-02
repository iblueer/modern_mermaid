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

# Use Xget accelerator
export ELECTRON_MIRROR="https://xget.xi-xu.me/gh/electron/electron/releases/download/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://xget.xi-xu.me/gh/electron-userland/electron-builder-binaries/releases/download/"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}Error: pnpm is not installed.${NC}"
    echo "Please install pnpm first: npm install -g pnpm"
    exit 1
fi

# Step 1: Install dependencies
echo -e "${YELLOW}[1/5] Installing dependencies...${NC}"
pnpm install

# Step 2: Clean previous builds
echo -e "${YELLOW}[2/5] Cleaning previous builds...${NC}"
rm -rf dist dist-electron release

# Step 3: Pre-download Electron binary (Workaround for Xget 429 on multi-thread)
echo -e "${YELLOW}[3/5] Pre-downloading Electron binary...${NC}"
CACHE_DIR="${HOME}/Library/Caches/electron"
mkdir -p "$CACHE_DIR"

# Dynamically get installed Electron version (e.g., v39.2.7)
# Note: pnpm install must run before this
if [ -f "./node_modules/.bin/electron" ]; then
    E_VER=$(./node_modules/.bin/electron --version)
else
    # Fallback if binary not found directly (should not happen after install)
    E_VER="v39.2.7" 
fi

echo "Detected Electron version: ${E_VER}"

E_FILE="electron-${E_VER}-darwin-arm64.zip"
E_URL="${ELECTRON_MIRROR}${E_VER}/${E_FILE}"

if [ ! -f "${CACHE_DIR}/${E_FILE}" ]; then
    echo "Downloading ${E_FILE} via curl (single-thread)..."
    curl -L "$E_URL" -o "${CACHE_DIR}/${E_FILE}" || {
        echo -e "${RED}Download failed. Please check your network.${NC}"
        rm -f "${CACHE_DIR}/${E_FILE}" # Clean up partial
        exit 1
    }
else
    echo "Electron binary already cached."
fi

# Step 4: Build the app
echo -e "${YELLOW}[4/5] Building the application...${NC}"
ELECTRON=true pnpm vite build
pnpm electron-builder --mac --dir

# Step 5: Install to ~/Applications
echo -e "${YELLOW}[5/5] Installing to ~/Applications/...${NC}"

# Match the executableName set in package.json
APP_NAME="ModernMermaid.app" 

# Check for arm64 or x64 build
if [ -d "release/mac-arm64/${APP_NAME}" ]; then
    SOURCE_APP="release/mac-arm64/${APP_NAME}"
elif [ -d "release/mac/${APP_NAME}" ]; then
    SOURCE_APP="release/mac/${APP_NAME}"
else
    # Fallback: try finding any .app if specific name fails
    FOUND_APP=$(find release -name "*.app" | head -n 1)
    if [ -n "$FOUND_APP" ]; then
        SOURCE_APP="$FOUND_APP"
        APP_NAME=$(basename "$FOUND_APP")
        echo -e "${YELLOW}Found app: ${APP_NAME}${NC}"
    else
        echo -e "${RED}Error: Build failed. App not found in release folder.${NC}"
        # debug: list release content
        ls -R release
        exit 1
    fi
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
