import { cp } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'

/**
 * Some files (planet feed, sitemap.xml, locally cached article images) are
 * written into public/ while pages are being rendered. Astro copies public/
 * into the output directory *before* pages are rendered, so on a clean build
 * those files would be missing from dist/. Copy public/ again once the build
 * is done so they end up in the output.
 */
function syncGeneratedPublicFiles() {
  let publicDir
  return {
    name: 'sync-generated-public-files',
    hooks: {
      'astro:config:done': ({ config }) => {
        publicDir = fileURLToPath(config.publicDir)
      },
      'astro:build:done': async ({ dir, logger }) => {
        await cp(publicDir, fileURLToPath(dir), { recursive: true, force: true })
        logger.info('Copied files generated into public/ during the build to the output directory')
      },
    },
  }
}

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
    syncGeneratedPublicFiles(),
  ],
  vite: {
    css: {
      postcss: './postcss.config.mjs',
    },
  },
})
