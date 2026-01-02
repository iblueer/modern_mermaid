import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

// Check if we're building for Electron
const isElectron = process.env.ELECTRON === 'true'

// Custom plugin to copy preload.cjs
const copyPreloadPlugin = () => ({
  name: 'copy-preload',
  buildStart() {
    if (isElectron) {
      const outDir = 'dist-electron'
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true })
      }
      copyFileSync(
        resolve(__dirname, 'electron/preload.cjs'),
        resolve(__dirname, outDir, 'preload.cjs')
      )
    }
  }
})

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Only include Electron plugins when building for Electron
    ...(isElectron ? [
      copyPreloadPlugin(),
      electron([
        {
          entry: 'electron/main.ts',
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron', 'chokidar', 'electron-store'],
              },
            },
          },
          onstart(options) {
            options.startup()
          },
        },
      ]),
      renderer(),
    ] : [
      // PWA only for web builds
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: "Modern Mermaid",
          short_name: "Mermaid",
          description: "A modern, beautiful Mermaid.js editor with custom themes and high-quality export.",
          start_url: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#1e1e1e",
          icons: [
            {
              src: "/icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: ({ request }) =>
                request.destination === 'document' ||
                request.destination === 'script' ||
                request.destination === 'style' ||
                request.destination === 'image' ||
                request.destination === 'font',
              handler: 'CacheFirst',
              options: {
                cacheName: 'mm-static-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
          ],
        },
      }),
    ]),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
  },
  base: isElectron ? './' : '/',
})
