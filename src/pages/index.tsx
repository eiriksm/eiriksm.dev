import { GetStaticProps } from "next"
import Head from "next/head"
import { drupal, getAllResources } from "@/lib/drupal"
import { DrupalNode } from "next-drupal"
import BlogPostCard from "@/components/BlogPostCard"
import Pagination from "@/components/Pagination"
import { DrupalJsonApiParams } from "drupal-jsonapi-params"

const POSTS_PER_PAGE = 10

interface HomePageProps {
  nodes: DrupalNode[]
  totalPages: number
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
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Latest Posts</h1>

        <div className="space-y-8">
          {nodes.map((node) => (
            <BlogPostCard key={node.id} node={node} />
          ))}
        </div>

        {nodes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No posts found.</p>
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

    const fetchedNodes = await getAllResources<DrupalNode>(
      "node--article",
      apiParams
    )

    const allNodes = (fetchedNodes as unknown as any[])
      .slice()
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

    const totalPosts = allNodes.length
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE)

    // Show only first page of posts
    const nodes = allNodes.slice(0, POSTS_PER_PAGE)

    console.log(`[getStaticProps] Home page: ${nodes.length} posts (${totalPosts} total, ${totalPages} pages)`)

    return {
      props: {
        nodes,
        totalPages,
      },
    }
  } catch (error) {
    console.error('[getStaticProps] Failed to fetch posts:', error)
    return {
      props: {
        nodes: [],
        totalPages: 0,
      },
    }
  }
}
