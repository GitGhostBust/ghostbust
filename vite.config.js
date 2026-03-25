import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], build: { rollupOptions: { input: { main: './index.html', app: './app.html', profile: './profile.html', community: './community.html', tos: './tos.html', privacy: './privacy.html', score: './score.html' } } } })
