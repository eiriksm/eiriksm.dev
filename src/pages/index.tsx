import { GetStaticProps } from "next"
import Head from "next/head"
import { drupal, getAllResources } from "@/lib/drupal"
import { DrupalNode } from "next-drupal"
import BlogPostCard from "@/components/BlogPostCard"
import Pagination from "@/components/Pagination"
import { DrupalJsonApiParams } from "drupal-jsonapi-params"
import { generatePlanetFeed } from "@/lib/planet-feed"
import { getIssueUrl } from "@/lib/github"

const POSTS_PER_PAGE = 10

interface NodeWithComments extends DrupalNode {
  commentCount?: number
}

interface HomePageProps {
  nodes: NodeWithComments[]
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

export default function HomePage({ nodes, totalPages }: HomePageProps) {
  return (
    <>
      <Head>
        <title>eiriksm.dev</title>
        <meta name="description" content="eiriksm.dev: Drupal blog for eiriksm." />
        <meta property="og:title" content="eiriksm.dev" />
        <meta property="og:description" content="eiriksm.dev: Drupal blog for eiriksm." />
      </Head>

      <div className="max-w-4xl mx-auto">
        <div>
          {nodes.map((node) => (
            <BlogPostCard key={node.id} node={node} commentCount={node.commentCount} />
          ))}
        </div>

        {nodes.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-muted)' }} className="text-lg">No posts found.</p>
          </div>
        )}

        <Pagination currentPage={1} totalPages={totalPages} />
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    console.log('[getStaticProps] Fetching all posts for home page...')

    const apiParams = new DrupalJsonApiParams()
    apiParams.addSort("created", "DESC")
    apiParams.addInclude(["field_tags"])

    const fetchedNodes = await getAllResources<DrupalNode>(
      "node--article",
      apiParams
    )

    const allNodes = (fetchedNodes as unknown as any[])
      .slice()
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

    const totalPosts = allNodes.length
    await generatePlanetFeed(allNodes)
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE)

    // Show only first page of posts
    const pageNodes = allNodes.slice(0, POSTS_PER_PAGE)

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

    console.log(`[getStaticProps] Home page: ${nodesWithComments.length} posts (${totalPosts} total, ${totalPages} pages)`)

    return {
      props: {
        nodes: nodesWithComments,
        totalPages,
        isBlogListing: true,
      },
    }
  } catch (error) {
    console.error('[getStaticProps] Failed to fetch posts:', error)
    return {
      props: {
        nodes: [],
        totalPages: 0,
        isBlogListing: true,
      },
    }
  }
}
