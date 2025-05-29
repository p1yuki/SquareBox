import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/SquareBox/',
  plugins: [
    react(),
    svgr(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SquareBox',
        short_name: 'SquareBox',
        description: '写真を正方形に整えるローカルファースト画像アプリ',
        start_url: '.',
        display: 'standalone',
        background_color: '#f5ede5',
        theme_color: '#e6b89c',
        icons: [
          {
            src: 'SquareBox.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
}); 