import { promises as fs } from "fs"
import path from "path"
import { GetStaticPaths, GetStaticProps } from "next"
import Head from "next/head"
import {
  addNodesToPathUuidMap,
  drupal,
  ensurePathUuidMap,
  getAllResources,
  normalizePath,
} from "@/lib/drupal"
import { DrupalNode } from "next-drupal"
import { formatDate, absoluteUrl, toUnixMillis } from "@/lib/utils"
import Comments from "@/components/Comments"
import { DrupalJsonApiParams } from "drupal-jsonapi-params"
import Link from "next/link"
import { FaComment } from "react-icons/fa"
import { getDisqusComments, type DisqusComment } from "@/lib/disqus"

interface BlogPostPageProps {
  node: DrupalNode
  comments?: any[]
  disqusComments?: DisqusComment[]
}

function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '')
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export default function BlogPostPage({ node, comments = [], disqusComments = [] }: BlogPostPageProps) {
  const tags = node.field_tags || []
  const path = node.path?.alias || `/node/${node.drupal_internal__nid}`
  const url = absoluteUrl(path)
  const excerpt = node.body?.summary || node.body?.value?.substring(0, 160)
  const readTime = estimateReadTime(node.body?.value || "")
  const imagePath = node.field_image?.uri?.url
  // Total comment count from both sources
  const commentCount = comments.length + disqusComments.length

  return (
    <>
      <Head>
        <title>{node.title} | eiriksm.dev</title>
        <meta name="description" content={excerpt} />
        <meta property="og:title" content={node.title} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={new Date(toUnixMillis(node.created as any)).toISOString()} />
        <meta property="article:author" content="Eirik S. Morland" />
        <meta name="twitter:title" content={node.title} />
        <meta name="twitter:description" content={excerpt} />
      </Head>

      <article className="article-full max-w-4xl mx-auto">
        <header className="article-full-header">
          <h1 className="article-full-title">
            {node.title}
          </h1>

          <div className="article-full-meta">
            <span className="author">Eirik S. Morland</span>
            <span className="separator">•</span>
            <time dateTime={new Date(toUnixMillis(node.created as any)).toISOString()}>
              {formatDate(node.created)}
            </time>
            <span className="separator">•</span>
            <span>{readTime} min read</span>
          </div>

          {tags.length > 0 && (
            <div className="article-full-tags">
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

          <div className="article-full-stats">
            <div className="stat-item">
              <FaComment />
              <span>{commentCount} comments</span>
            </div>
          </div>
        </header>

        <div
          className="article-body blog-content prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: node.body?.value || "" }}
        />

        {imagePath && (
          <div className="mt-10">
            <img
              alt={node.title}
              className="mx-auto"
              decoding="async"
              loading="lazy"
              src={imagePath}
            />
          </div>
        )}

        {(node.field_issue_comment_id || disqusComments.length > 0) && (
          <Comments
            issueId={node.field_issue_comment_id}
            initialComments={comments}
            disqusComments={disqusComments}
          />
        )}

        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: node.title,
              datePublished: new Date(toUnixMillis(node.created as any)).toISOString(),
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

    addNodesToPathUuidMap(nodes)

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
      console.warn(
        `[getStaticProps] No node found via direct path fetch. Trying map-based fallback...`
      )

      const pathMap = await ensurePathUuidMap()
      const normalizedCandidates = candidatePaths.map(normalizePath)
      const matchedUuid = normalizedCandidates
        .map((candidate) => pathMap[candidate])
        .find(Boolean)

      if (matchedUuid) {
        console.log(
          `[getStaticProps] Found UUID ${matchedUuid} for candidate paths ${normalizedCandidates.join(", ")}`
        )

        node = await drupal.getResource<DrupalNode>(
          "node--article",
          matchedUuid,
          {
            params: {
              include: "field_tags,field_image",
            },
          }
        )
      }

      if (node) {
        console.log(
          `[getStaticProps] Loaded node via map fallback: ${node.title}`
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

    const normalizedPath = normalizePath(node.path?.alias || `/node/${node.drupal_internal__nid}`)
    let comments: any[] = []
    let imagePath = node.field_image?.uri?.url
    const drupalBaseUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || "https://example.com"

    if (imagePath) {
      try {
        const imageUrl = new URL(imagePath, drupalBaseUrl)
        const localPathname = imageUrl.pathname
        const publicRoot = path.join(process.cwd(), "public")
        const localFilePath = path.join(publicRoot, localPathname)
        const normalizedLocalFilePath = path.normalize(localFilePath)

        if (!normalizedLocalFilePath.startsWith(publicRoot)) {
          throw new Error(`Invalid image path: ${localPathname}`)
        }

        await fs.mkdir(path.dirname(normalizedLocalFilePath), { recursive: true })

        try {
          await fs.access(normalizedLocalFilePath)
        } catch {
          const response = await fetch(imageUrl.toString())
          if (!response.ok) {
            throw new Error(`Failed to fetch image ${imageUrl} (${response.status})`)
          }
          const arrayBuffer = await response.arrayBuffer()
          await fs.writeFile(normalizedLocalFilePath, Buffer.from(arrayBuffer))
        }

        imagePath = localPathname
      } catch (error) {
        console.warn(`[getStaticProps] Failed to cache image locally for ${normalizedPath}:`, error)
      }
    }
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || "eiriksm/eiriksm.dev-comments"

    if (node.field_issue_comment_id) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${repo}/issues/${node.field_issue_comment_id}/comments`,
          {
            headers: process.env.GITHUB_TOKEN
              ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
              : {},
          }
        )

        if (response.ok) {
          comments = await response.json()
          console.log(`[getStaticProps] Prefetched ${comments.length} GitHub comments for ${normalizedPath}`)
        } else {
          console.warn(`[getStaticProps] Failed to prefetch comments for ${normalizedPath}: ${response.status}`)
        }
      } catch (error) {
        console.warn(`[getStaticProps] Error prefetching comments for ${normalizedPath}:`, error)
      }
    }

    // Get disqus comments
    const disqusComments = getDisqusComments(normalizedPath)
    if (disqusComments.length > 0) {
      console.log(`[getStaticProps] Found ${disqusComments.length} disqus comments for ${normalizedPath}`)
    }

    console.log(`[getStaticProps] Successfully fetched: ${node.title}`)

    return {
      props: {
        node: {
          ...node,
          field_image: imagePath ? { ...node.field_image, uri: { ...node.field_image?.uri, url: imagePath } } : node.field_image,
        },
        comments,
        disqusComments,
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
