import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://eiriksm.dev',
  output: 'static',
  trailingSlash: 'always',
  prefetch: {
    defaultStrategy: 'viewport',
    prefetchAll: true,
  },
  integrations: [
    react(),
    sitemap(),
  ],
  vite: {
    css: {
      postcss: './postcss.config.mjs',
    },
  },
})
