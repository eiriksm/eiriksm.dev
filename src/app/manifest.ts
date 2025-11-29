import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'eiriksm.dev',
    short_name: 'eiriksm',
    description: 'eiriksm.dev: Drupal blog for eiriksm.',
    start_url: '/',
    display: 'minimal-ui',
    background_color: '#718096',
    theme_color: '#718096',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
