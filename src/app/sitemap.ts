import { MetadataRoute } from 'next'
import { drupal } from '@/lib/drupal'
import { DrupalNode } from 'next-drupal'
import { getNodePath } from '@/lib/utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eiriksm.dev'

  // Fetch all articles
  const nodes = await drupal.getResourceCollectionFromContext<DrupalNode>(
    'node--article',
    {
      params: {
        'sort': '-created',
      },
    }
  )

  // Generate sitemap entries for articles
  const articles = nodes.map((node) => ({
    url: `${baseUrl}${getNodePath(node)}`,
    lastModified: new Date(node.changed || node.created),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/talks`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  return [...staticPages, ...articles]
}
