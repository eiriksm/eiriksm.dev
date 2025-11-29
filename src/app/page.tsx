import { drupal } from "@/lib/drupal"
import { DrupalNode } from "next-drupal"
import BlogPostCard from "@/components/BlogPostCard"
import Pagination from "@/components/Pagination"

const POSTS_PER_PAGE = 10

export default async function HomePage() {
  let allNodes: any[] = []

  try {
    // Fetch all posts to get accurate count and proper pagination
    const fetchedNodes = await drupal.getResourceCollectionFromContext<DrupalNode>(
      "node--article",
      {
        params: {
          "sort": "-created",
        },
      }
    )
    allNodes = fetchedNodes as unknown as any[]
  } catch (error) {
    console.error('Failed to fetch posts:', error)
  }

  // Calculate pagination based on all posts
  const totalPosts = allNodes.length
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE)

  // Show only first page of posts
  const nodes = allNodes.slice(0, POSTS_PER_PAGE)

  return (
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
  )
}
