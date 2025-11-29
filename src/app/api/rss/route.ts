import { drupal } from '@/lib/drupal'
import { DrupalNode } from 'next-drupal'
import { getNodePath, extractExcerpt } from '@/lib/utils'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eiriksm.dev'

  // Fetch all articles
  const nodes = await drupal.getResourceCollectionFromContext<DrupalNode>(
    'node--article',
    {
      params: {
        'sort': '-created',
        'include': 'field_tags',
      },
    }
  )

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>eiriksm.dev</title>
    <link>${baseUrl}</link>
    <description>eiriksm.dev: Drupal blog for eiriksm.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/planet" rel="self" type="application/rss+xml"/>
    ${nodes
      .map((node) => {
        const path = getNodePath(node)
        const url = `${baseUrl}${path}`
        const excerpt = node.body?.summary || extractExcerpt(node.body?.value || '')
        const pubDate = new Date(node.created).toUTCString()

        return `
    <item>
      <title><![CDATA[${node.title}]]></title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description><![CDATA[${excerpt}]]></description>
      <pubDate>${pubDate}</pubDate>
      <content:encoded><![CDATA[${node.body?.value || ''}]]></content:encoded>
    </item>`
      })
      .join('')}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  })
}
