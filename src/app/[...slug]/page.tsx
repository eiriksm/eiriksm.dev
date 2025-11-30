import { drupal } from "@/lib/drupal"
import { DrupalNode } from "next-drupal"
import { formatDate, absoluteUrl } from "@/lib/utils"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Comments from "@/components/Comments"
import { DrupalJsonApiParams } from "drupal-jsonapi-params"

interface BlogPostPageProps {
  params: Promise<{
    slug: string[]
  }>
}

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const path = `/${slug.join("/")}`

  try {
    // Use getResourceByPath instead of translatePath + getResource
    const node = await drupal.getResourceByPath<DrupalNode>(
      path,
      {
        params: {
          "include": "field_tags,field_image",
        },
      }
    )

    if (!node) {
      return {}
    }

    const url = absoluteUrl(path)
    const excerpt = node.body?.summary || node.body?.value?.substring(0, 160)

    return {
      title: node.title,
      description: excerpt,
      openGraph: {
        title: node.title,
        description: excerpt,
        url: url,
        type: "article",
        publishedTime: new Date((node.created as unknown as number) * 1000).toISOString(),
        authors: ["Eirik S. Morland"],
      },
      twitter: {
        card: "summary_large_image",
        title: node.title,
        description: excerpt,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const path = `/${slug.join("/")}`

  let node: DrupalNode

  try {
    // Use getResourceByPath instead of translatePath + getResource
    // This is more direct and avoids the /router/translate-path endpoint
    node = await drupal.getResourceByPath<DrupalNode>(
      path,
      {
        params: {
          "include": "field_tags,field_image",
        },
      }
    )
  } catch (error) {
    console.error('Error fetching blog post:', error)
    notFound()
  }

  if (!node) {
    notFound()
  }

  const tags = node.field_tags || []

  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {node.title}
        </h1>
        <div className="flex items-center text-gray-600 text-sm space-x-4">
          <time dateTime={new Date((node.created as unknown as number) * 1000).toISOString()}>
            {formatDate(node.created)}
          </time>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag: any) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.drupal_internal__tid}/`}
                className="tag"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      <div
        className="blog-content prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: node.body?.value || "" }}
      />

      {node.field_issue_comment_id && (
        <Comments issueId={node.field_issue_comment_id} />
      )}

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: node.title,
            datePublished: new Date((node.created as unknown as number) * 1000).toISOString(),
            author: {
              "@type": "Person",
              name: "Eirik S. Morland",
              url: "https://eiriksm.dev",
            },
            publisher: {
              "@type": "Person",
              name: "Eirik S. Morland",
            },
          }),
        }}
      />
    </article>
  )
}

export async function generateStaticParams() {
  try {
    console.log('[generateStaticParams] Fetching blog posts from Drupal API...')

    const apiParams = new DrupalJsonApiParams()
    apiParams.addSort("created", "DESC")
    apiParams.addInclude(["field_tags", "field_image"])

    // Use getResourceCollection instead of getResourceCollectionFromContext for App Router
    const nodes = await drupal.getResourceCollection<DrupalNode>(
      "node--article",
      {
        params: apiParams.getQueryObject(),
      }
    )

    console.log(`[generateStaticParams] Found ${nodes.length} blog posts`)

    const params = nodes.map((node) => {
      const path = node.path?.alias || `/node/${node.drupal_internal__nid}`
      const slug = path.split("/").filter(Boolean)
      console.log(`[generateStaticParams] Generated path: /${slug.join("/")}`)
      return { slug }
    })

    console.log(`[generateStaticParams] Total params generated: ${params.length}`)
    return params
  } catch (error) {
    console.error('[generateStaticParams] ERROR: Failed to generate static params for blog posts:', error)
    console.error('[generateStaticParams] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')

    // IMPORTANT: Returning empty array means NO static pages will be generated!
    // This will cause all blog posts to 404 in static export
    console.warn('[generateStaticParams] WARNING: Returning empty array - no static pages will be generated!')
    return []
  }
}
