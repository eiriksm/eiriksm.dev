import { GetStaticPaths, GetStaticProps } from "next"
import Head from "next/head"
import { drupal, getAllResources } from "@/lib/drupal"
import { DrupalNode } from "next-drupal"
import BlogPostCard from "@/components/BlogPostCard"
import Pagination from "@/components/Pagination"
import { DrupalJsonApiParams } from "drupal-jsonapi-params"
import { getIssueUrl } from "@/lib/github"

const POSTS_PER_PAGE = 10

interface NodeWithComments extends DrupalNode {
  commentCount?: number
}

interface BlogPageProps {
  nodes: NodeWithComments[]
  currentPage: number
  totalPages: number
  isBlogListing: boolean
}

async function fetchCommentCount(issueId: string, repo: string): Promise<number> {
  try {
    const response = await fetch(
      getIssueUrl(issueId, repo),
      {
        headers: process.env.GITHUB_TOKEN
          ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
          : {},
      }
    )
    if (response.ok) {
      const issue = await response.json()
      return issue.comments || 0
    }
  } catch (error) {
    console.warn(`Failed to fetch comment count for issue ${issueId}:`, error)
  }
  return 0
}

export default function BlogPage({ nodes, currentPage, totalPages }: BlogPageProps) {
  return (
    <>
      <Head>
        <title>Latest Posts - Page {currentPage} | eiriksm.dev</title>
        <meta name="description" content={`Blog posts page ${currentPage}`} />
      </Head>

      <div className="max-w-4xl mx-auto">
        <div>
          {nodes.map((node) => (
            <BlogPostCard key={node.id} node={node} commentCount={node.commentCount} />
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    console.log('[getStaticPaths] Generating pagination paths...')

    const apiParams = new DrupalJsonApiParams()
    apiParams.addSort("created", "DESC")

    const nodes = (
      await getAllResources<DrupalNode>("node--article", apiParams)
    )
      .slice()
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

    const totalPages = Math.ceil(nodes.length / POSTS_PER_PAGE)
    const paths: Array<{ params: { page: string } }> = []

    // Generate paths for pages 2 and onwards (page 1 is the index)
    for (let i = 2; i <= totalPages; i++) {
      paths.push({ params: { page: i.toString() } })
    }

    console.log(`[getStaticPaths] Generated ${paths.length} pagination paths (pages 2-${totalPages})`)

    return {
      paths,
      fallback: false,
    }
  } catch (error) {
    console.error('[getStaticPaths] Failed to generate pagination paths:', error)
    return {
      paths: [],
      fallback: false,
    }
  }
}

export const getStaticProps: GetStaticProps<BlogPageProps> = async ({ params }) => {
  const page = params?.page as string
  const currentPage = parseInt(page, 10)

  if (isNaN(currentPage) || currentPage < 1) {
    return {
      notFound: true,
    }
  }

  try {
    console.log(`[getStaticProps] Fetching posts for page ${currentPage}...`)

    const apiParams = new DrupalJsonApiParams()
    apiParams.addSort("created", "DESC")
    apiParams.addInclude(["field_tags"])

    const allNodes = (
      await getAllResources<DrupalNode>("node--article", apiParams)
    )
      .slice()
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

    const totalPosts = allNodes.length
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE)

    if (currentPage > totalPages) {
      return {
        notFound: true,
      }
    }

    // Calculate pagination
    const offset = (currentPage - 1) * POSTS_PER_PAGE
    const pageNodes = allNodes.slice(offset, offset + POSTS_PER_PAGE)

    // Fetch comment counts from GitHub Issues
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || "eiriksm/eiriksm.dev-comments"
    const nodesWithComments: NodeWithComments[] = await Promise.all(
      pageNodes.map(async (node: any) => {
        let commentCount = 0

        // Try GitHub Issues first
        if (node.field_issue_comment_id) {
          commentCount = await fetchCommentCount(node.field_issue_comment_id, repo)
        }

        return { ...node, commentCount }
      })
    )

    console.log(`[getStaticProps] Page ${currentPage}: ${nodesWithComments.length} posts (${totalPosts} total)`)

    return {
      props: {
        nodes: nodesWithComments,
        currentPage,
        totalPages,
        isBlogListing: true,
      },
    }
  } catch (error) {
    console.error(`[getStaticProps] Failed to fetch posts for page ${currentPage}:`, error)
    return {
      notFound: true,
    }
  }
}
