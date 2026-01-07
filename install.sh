#!/bin/bash
# install.sh
# Modern Mermaid 安装脚本
#
# 用法:
#   ./install.sh           # 构建并安装到 ~/Applications
#   ./install.sh --force   # 强制安装（不询问确认）
#   ./install.sh --help    # 显示帮助

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

# 应用信息
APP_NAME="ModernMermaid"
APP_BUNDLE="$APP_NAME.app"
APPS_DIR="$HOME/Applications"
APP_TARGET="$APPS_DIR/$APP_BUNDLE"
BACKUP_DIR="$HOME/.${APP_NAME}_backups"

# 参数
FORCE=false

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

show_help() {
    cat << 'EOF'
Modern Mermaid 安装脚本

用法: ./install.sh [选项]

选项:
  --force, -f    强制安装（不询问确认，直接覆盖旧版本）
  --help, -h     显示此帮助

默认行为:
  1. 安装 npm 依赖
  2. 预下载 Electron
  3. 构建应用 (electron-builder)
  4. 备份旧版本 (如存在)
  5. 安装到 ~/Applications

备份位置: ~/.ModernMermaid_backups/
EOF
}

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --force|-f) FORCE=true; shift ;;
        --help|-h) show_help; exit 0 ;;
        *) log_error "未知参数: $1"; show_help; exit 1 ;;
    esac
done

echo "╔════════════════════════════════════════╗"
echo "║      Modern Mermaid - 安装脚本         ║"
echo "╚════════════════════════════════════════╝"
echo ""

cd "$PROJECT_ROOT"

# Use Xget accelerator
export ELECTRON_MIRROR="https://xget.xi-xu.me/gh/electron/electron/releases/download/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://xget.xi-xu.me/gh/electron-userland/electron-builder-binaries/releases/download/"

# Step 1: 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    log_error "pnpm 未安装"
    echo "请先安装: npm install -g pnpm"
    exit 1
fi

# Step 2: 安装依赖
log_step "安装依赖..."
pnpm install

# Step 3: 清理旧构建
log_step "清理旧构建..."
rm -rf dist dist-electron release

# Step 4: 预下载 Electron
log_step "预下载 Electron..."
CACHE_DIR="${HOME}/Library/Caches/electron"
mkdir -p "$CACHE_DIR"

if [ -f "./node_modules/.bin/electron" ]; then
    E_VER=$(./node_modules/.bin/electron --version)
else
    E_VER="v39.2.7"
fi

log_info "Electron 版本: ${E_VER}"

E_FILE="electron-${E_VER}-darwin-arm64.zip"
E_URL="${ELECTRON_MIRROR}${E_VER}/${E_FILE}"

if [ ! -f "${CACHE_DIR}/${E_FILE}" ]; then
    log_info "下载 ${E_FILE}..."
    curl -L "$E_URL" -o "${CACHE_DIR}/${E_FILE}" || {
        log_error "下载失败"
        rm -f "${CACHE_DIR}/${E_FILE}"
        exit 1
    }
else
    log_info "Electron 已缓存"
fi

# Step 5: 构建
log_step "构建应用..."
ELECTRON=true pnpm vite build
pnpm electron-builder --mac --dir

# Step 6: 查找构建结果
APP_SOURCE=""
if [ -d "release/mac-arm64/${APP_BUNDLE}" ]; then
    APP_SOURCE="release/mac-arm64/${APP_BUNDLE}"
elif [ -d "release/mac/${APP_BUNDLE}" ]; then
    APP_SOURCE="release/mac/${APP_BUNDLE}"
else
    FOUND_APP=$(find release -name "*.app" | head -n 1)
    if [ -n "$FOUND_APP" ]; then
        APP_SOURCE="$FOUND_APP"
        APP_BUNDLE=$(basename "$FOUND_APP")
        APP_TARGET="$APPS_DIR/$APP_BUNDLE"
    fi
fi

if [ -z "$APP_SOURCE" ] || [ ! -d "$APP_SOURCE" ]; then
    log_error "构建失败，未找到 .app"
    ls -R release 2>/dev/null || true
    exit 1
fi

log_info "构建成功: $APP_SOURCE"

# Step 7: 备份旧版本
if [[ -d "$APP_TARGET" ]]; then
    log_step "检测到旧版本..."
    
    if [[ "$FORCE" != "true" ]]; then
        echo ""
        read -p "是否覆盖旧版本? [y/N] " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_warn "已取消"
            exit 0
        fi
    fi
    
    # 备份
    mkdir -p "$BACKUP_DIR"
    BACKUP_NAME="${APP_BUNDLE}.backup.$(date +%Y%m%d_%H%M%S)"
    log_info "备份到: $BACKUP_DIR/$BACKUP_NAME"
    mv "$APP_TARGET" "$BACKUP_DIR/$BACKUP_NAME"
    
    # 清理旧备份（保留5个）
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$BACKUP_COUNT" -gt 5 ]]; then
        log_info "清理旧备份..."
        ls -t "$BACKUP_DIR" | tail -n +6 | xargs -I {} rm -rf "$BACKUP_DIR/{}"
    fi
fi

# Step 8: 安装
log_step "安装到 $APPS_DIR..."
mkdir -p "$APPS_DIR"
cp -R "$APP_SOURCE" "$APP_TARGET"

# 完成
echo ""
echo "╔════════════════════════════════════════╗"
echo "║      ✅ 安装完成!                       ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "应用位置: $APP_TARGET"
echo "启动命令: open \"$APP_TARGET\""
echo ""

# 询问是否启动
if [[ "$FORCE" != "true" ]]; then
    read -p "立即启动? [Y/n] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        open "$APP_TARGET"
    fi
fi
