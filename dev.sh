#!/bin/bash
# dev.sh
# Modern Mermaid 开发运行脚本

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "╔════════════════════════════════════════╗"
echo "║      Modern Mermaid - Dev Mode         ║"
echo "╚════════════════════════════════════════╝"
echo ""

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  未检测到 pnpm"
    echo ""
    echo "安装 pnpm:"
    echo "  npm install -g pnpm"
    exit 1
fi

# 检查 node_modules
if [[ ! -d "$PROJECT_ROOT/node_modules" ]]; then
    echo "📦 首次运行，安装依赖..."
    pnpm install
    echo ""
fi

echo "选择运行模式:"
echo "  1. 开发服务器 (推荐 - 热更新)"
echo "  2. 预览构建结果"
echo "  3. 构建生产版本"
echo ""
read -p "请选择 (1/2/3, 默认 1): " choice

case "$choice" in
    2)
        echo ""
        echo "🔍 预览构建结果..."
        pnpm build && pnpm preview
        ;;
    3)
        echo ""
        echo "📦 构建生产版本..."
        pnpm build
        echo ""
        echo "✅ 构建完成: dist/"
        ;;
    *)
        echo ""
        echo "🚀 启动开发服务器..."
        pnpm dev
        ;;
esac
