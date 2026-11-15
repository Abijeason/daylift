/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/daylift/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Daylift',
        short_name: 'Daylift',
        description: "Today's gym workout, guided step by step.",
        start_url: '/daylift/',
        scope: '/daylift/',
        display: 'standalone',
        background_color: '#0c0c0d',
        theme_color: '#0c0c0d',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Curated exercise images are precached so planned workouts work with no signal.
        globPatterns: ['**/*.{js,css,html,jpg,png,txt}'],
        // The full library's photos are too many to install; each is saved the first time it's viewed.
        globIgnores: ['library/**'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.includes('/library/'),
          handler: 'CacheFirst',
          options: { cacheName: 'library-images', expiration: { maxEntries: 2000 } },
        }],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
})
