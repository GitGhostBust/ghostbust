import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        deleteAfterUpload: true,
      },
    }),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
        app: './app.html',
        profile: './profile.html',
        community: './community.html',
        tos: './tos.html',
        privacy: './privacy.html',
        score: './score.html',
      }
    }
  }
})
