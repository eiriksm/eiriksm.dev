import { drupal } from "@/lib/drupal"
import { DrupalNode } from "next-drupal"
import { formatDate, absoluteUrl } from "@/lib/utils"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Comments from "@/components/Comments"

interface BlogPostPageProps {
  params: Promise<{
    slug: string[]
  }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const path = `/${slug.join("/")}`

  try {
    const node = await drupal.getResourceFromContext<DrupalNode>(
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
        publishedTime: new Date(node.created * 1000).toISOString(),
        authors: ["Eirik S. Morland"],
      },
      twitter: {
        card: "summary_large_image",
        title: node.title,
        description: excerpt,
      },
    }
  } catch (error) {
    return {}
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const path = `/${slug.join("/")}`

  let node: DrupalNode

  try {
    node = await drupal.getResourceFromContext<DrupalNode>(
      path,
      {
        params: {
          "include": "field_tags,field_image",
        },
      }
    )
  } catch (error) {
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
          <time dateTime={new Date(node.created * 1000).toISOString()}>
            {formatDate(node.created)}
          </time>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag: any) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.drupal_internal__tid}`}
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
            datePublished: new Date(node.created * 1000).toISOString(),
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
    const nodes = await drupal.getResourceCollectionFromContext<DrupalNode>(
      "node--article",
      {
        params: {
          "sort": "-created",
        },
      }
    )

    return nodes.map((node) => {
      const path = node.path?.alias || `/node/${node.drupal_internal__nid}`
      const slug = path.split("/").filter(Boolean)
      return { slug }
    })
  } catch (error) {
    console.warn('Failed to generate static params for blog posts:', error)
    return []
  }
}

export const dynamicParams = true
