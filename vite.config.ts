import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), svgr()],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api(\/?)/, '$1'), // 移除 /api 前缀，并保留或添加斜杠
            },
            '/websocket': {
                target: (process.env.VITE_BACKEND_URL || 'http://localhost:8080').replace('http', 'ws'),
                changeOrigin: true,
                ws: true,
                secure: false,
            },
        },
    },
    preview: {
        port: 3000,
    },
})