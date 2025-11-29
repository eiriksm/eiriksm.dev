import { drupal } from "@/lib/drupal"
import { DrupalNode } from "next-drupal"
import BlogPostCard from "@/components/BlogPostCard"
import Pagination from "@/components/Pagination"
import { notFound } from "next/navigation"

const POSTS_PER_PAGE = 10

interface BlogPageProps {
  params: Promise<{
    page: string
  }>
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { page } = await params
  const currentPage = parseInt(page, 10)

  if (isNaN(currentPage) || currentPage < 1) {
    notFound()
  }

  // Fetch all nodes to get total count
  const allNodes = await drupal.getResourceCollectionFromContext<DrupalNode>(
    "node--article",
    {
      params: {
        "sort": "-created",
      },
    }
  )

  const totalPosts = allNodes.length
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE)

  if (currentPage > totalPages) {
    notFound()
  }

  // Calculate pagination
  const offset = (currentPage - 1) * POSTS_PER_PAGE
  const nodes = allNodes.slice(offset, offset + POSTS_PER_PAGE)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">
        Latest Posts - Page {currentPage}
      </h1>

      <div className="space-y-8">
        {nodes.map((node) => (
          <BlogPostCard key={node.id} node={node} />
        ))}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  )
}

export async function generateStaticParams() {
  const nodes = await drupal.getResourceCollectionFromContext<DrupalNode>(
    "node--article",
    {
      params: {
        "sort": "-created",
      },
    }
  )

  const totalPages = Math.ceil(nodes.length / POSTS_PER_PAGE)
  const pages = []

  for (let i = 2; i <= totalPages; i++) {
    pages.push({ page: i.toString() })
  }

  return pages
}
