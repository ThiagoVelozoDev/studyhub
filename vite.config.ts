import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      manifest: {
        name: 'Repositório Estudos',
        short_name: 'Repositório Estudos',
        description: 'Plataforma de gerenciamento de estudos para concursos',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (/react-router|\/react\/|\/react-dom\//.test(id)) return 'vendor-react'
          if (id.includes('firebase')) return 'vendor-firebase'
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
          if (id.includes('jspdf') || id.includes('xlsx')) return 'vendor-export'
          return 'vendor'
        },
      },
    },
  },
})
