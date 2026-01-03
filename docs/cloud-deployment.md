# Modern Mermaid 云端部署指南

本文档介绍如何将 Modern Mermaid 部署为线上网站，以及 Web 模式下的功能差异。

## 项目架构

Modern Mermaid 是一个**双模式应用**：

| 模式 | 运行环境 | 本地文件管理 |
|------|---------|-------------|
| **Web 模式** | 浏览器 | ❌ 不支持 |
| **Electron 模式** | 桌面应用 | ✅ 完整支持 |

## 快速部署

### 方式一：静态网站托管

项目构建产物是纯静态文件，可部署到任意静态托管平台：

```bash
# 构建生产版本
pnpm build

# 构建产物在 dist/ 目录
```

推荐部署平台：
- [Vercel](https://vercel.com) - 推荐，零配置
- [Netlify](https://netlify.com)
- [GitHub Pages](https://pages.github.com)
- [Cloudflare Pages](https://pages.cloudflare.com)

### 方式二：Vercel 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/modern_mermaid)

### 方式三：GitHub Pages

1. 在仓库 Settings → Pages 中启用 GitHub Pages
2. 配置 GitHub Actions 自动部署（参考 `.github/workflows/` 目录）

## Web 模式功能对比

### ✅ 完整可用功能

| 功能 | 说明 |
|------|------|
| Mermaid 图表编辑 | 实时预览 |
| 18+ 精美主题 | 完整支持 |
| 背景/字体自定义 | 完整支持 |
| 图片导出 | PNG/JPG，支持透明背景 |
| 复制到剪贴板 | 完整支持 |
| 分享链接 | URL 包含压缩后的代码 |
| 标注工具 | 箭头、文字、矩形、圆形等 |
| 示例模板 | 多种图表类型示例 |
| AI 生成 | 需配置 LLM API |
| 多语言支持 | 中/英/日/葡/西 |
| 深色模式 | 自动/手动切换 |

### ❌ 仅 Electron 模式可用

| 功能 | 原因 |
|------|------|
| 本地文件管理 | 浏览器沙盒安全限制 |
| 文件侧边栏 | 依赖本地文件系统 |
| 自动保存 | 需要文件系统访问权限 |

## 浏览器安全限制说明

Web 应用运行在浏览器沙盒中，出于安全考虑无法直接访问用户本地文件系统。这是 Web 安全的核心原则，防止恶意网站读取或修改用户文件。

项目代码中已通过 `isElectron` 判断来区分两种模式：
- Web 模式下，文件侧边栏自动隐藏
- Web 模式下，分享功能正常显示

## 扩展方案

如需在 Web 模式下支持本地文件管理，可考虑以下方案：

### 方案 1：File System Access API

现代浏览器（Chrome/Edge 86+）支持 [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)：

- 用户需手动授权选择文件夹
- 每次刷新页面需要重新授权
- Safari/Firefox 支持较差

### 方案 2：本地 Helper 应用

开发轻量级本地服务：

- 运行在 `localhost`（如 `localhost:3456`）
- 网站通过 HTTP/WebSocket 与 Helper 通信
- 类似 Obsidian Sync、Logseq 本地同步的实现方式

### 方案 3：云端存储

集成云存储服务：

- Google Drive / Dropbox / OneDrive
- GitHub Gist
- 自建云存储服务

## 环境变量配置

部署时可通过环境变量配置 AI 功能（可选）：

```env
# AI LLM 配置（可选）
VITE_LLM_PROVIDER=openai
VITE_LLM_API_KEY=your-api-key
VITE_LLM_BASE_URL=https://api.openai.com/v1
VITE_LLM_MODEL=gpt-4o

# Google Analytics（可选）
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 构建配置

项目使用 Vite 构建，主要配置文件：

- `vite.config.ts` - Vite 配置
- `tsconfig.json` - TypeScript 配置
- `package.json` - 依赖和脚本

### 常用命令

```bash
# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview

# 代码检查
pnpm lint
```

## 相关资源

- [Mermaid 官方文档](https://mermaid.js.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [React 官方文档](https://react.dev/)
