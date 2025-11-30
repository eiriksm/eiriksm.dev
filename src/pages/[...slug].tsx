import { GetStaticPaths, GetStaticProps } from "next"
import Head from "next/head"
import Link from "next/link"
import { drupal, getAllResources } from "@/lib/drupal"
import { DrupalNode } from "next-drupal"
import { formatDate, absoluteUrl } from "@/lib/utils"
import Comments from "@/components/Comments"
import { DrupalJsonApiParams } from "drupal-jsonapi-params"

interface BlogPostPageProps {
  node: DrupalNode
}

export default function BlogPostPage({ node }: BlogPostPageProps) {
  const tags = node.field_tags || []
  const path = node.path?.alias || `/node/${node.drupal_internal__nid}`
  const url = absoluteUrl(path)
  const excerpt = node.body?.summary || node.body?.value?.substring(0, 160)

  return (
    <>
      <Head>
        <title>{node.title} | eiriksm.dev</title>
        <meta name="description" content={excerpt} />
        <meta property="og:title" content={node.title} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={new Date((node.created as unknown as number) * 1000).toISOString()} />
        <meta property="article:author" content="Eirik S. Morland" />
        <meta name="twitter:title" content={node.title} />
        <meta name="twitter:description" content={excerpt} />
      </Head>

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
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    console.log('[getStaticPaths] Fetching blog posts from Drupal API...')

    const apiParams = new DrupalJsonApiParams()
    apiParams.addSort("created", "DESC")
    apiParams.addInclude(["field_tags", "field_image"])

    const nodes = await getAllResources<DrupalNode>(
      "node--article",
      apiParams
    )

    console.log(`[getStaticPaths] Found ${nodes.length} blog posts`)

    const paths = nodes.map((node) => {
      const path = node.path?.alias || `/node/${node.drupal_internal__nid}`
      const slug = path.split("/").filter(Boolean)
      console.log(`[getStaticPaths] Generated path: /${slug.join("/")}`)
      return {
        params: { slug }
      }
    })

    console.log(`[getStaticPaths] Total paths generated: ${paths.length}`)

    return {
      paths,
      fallback: false, // 404 for any paths not returned by getStaticPaths
    }
  } catch (error) {
    console.error('[getStaticPaths] ERROR: Failed to generate static paths:', error)
    console.error('[getStaticPaths] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return {
      paths: [],
      fallback: false,
    }
  }
}

export const getStaticProps: GetStaticProps<BlogPostPageProps> = async ({ params }) => {
  const slug = params?.slug as string[]
  const basePath = `/${slug.join("/")}`
  const candidatePaths = Array.from(
    new Set([
      basePath,
      basePath.endsWith("/") ? basePath.slice(0, -1) : `${basePath}/`,
    ])
  )

  try {
    let node: DrupalNode | null = null
    let lastError: unknown

    for (const path of candidatePaths) {
      console.log(`[getStaticProps] Fetching blog post for path: ${path}`)

      try {
        node = await drupal.getResourceByPath<DrupalNode>(path, {
          params: {
            "include": "field_tags,field_image",
          },
        })

        if (node) {
          console.log(`[getStaticProps] Found node for path: ${path}`)
          break
        }

        console.warn(`[getStaticProps] No node found for path: ${path}`)
      } catch (error) {
        lastError = error

        const status = (error as any)?.response?.status
        if (status === 404) {
          console.warn(`[getStaticProps] 404 for path: ${path}`)
          continue
        }

        console.error(
          `[getStaticProps] Error fetching path ${path}:`,
          error
        )
      }
    }

    if (!node) {
      console.error(
        `[getStaticProps] No node found for any candidate paths: ${candidatePaths.join(", ")}`,
        lastError ? `Last error: ${String(lastError)}` : ""
      )
      return {
        notFound: true,
      }
    }

    console.log(`[getStaticProps] Successfully fetched: ${node.title}`)

    return {
      props: {
        node,
      },
    }
  } catch (error) {
    console.error(
      `[getStaticProps] Error fetching blog post for ${basePath}:`,
      error
    )
    return {
      notFound: true,
    }
  }
}
