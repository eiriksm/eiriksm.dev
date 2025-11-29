import { drupal } from "@/lib/drupal"
import { DrupalNode } from "next-drupal"
import BlogPostCard from "@/components/BlogPostCard"
import Pagination from "@/components/Pagination"
import { notFound } from "next/navigation"
import { DrupalJsonApiParams } from "drupal-jsonapi-params"

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
  const apiParams = new DrupalJsonApiParams()
  apiParams.addSort("created", "DESC")

  const allNodes = (
    await drupal.getResourceCollectionFromContext<DrupalNode>(
      "node--article",
      {
        params: apiParams.getQueryObject(),
      }
    )
  )
    .slice()
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

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
  try {
    const apiParams = new DrupalJsonApiParams()
    apiParams.addSort("created", "DESC")

    const nodes = (
      await drupal.getResourceCollectionFromContext<DrupalNode>(
        "node--article",
        {
          params: apiParams.getQueryObject(),
        }
      )
    )
      .slice()
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

    const totalPages = Math.ceil(nodes.length / POSTS_PER_PAGE)
    const pages = []

    for (let i = 2; i <= totalPages; i++) {
      pages.push({ page: i.toString() })
    }

    return pages
  } catch (error) {
    console.warn('Failed to generate static params for blog pagination:', error)
    return []
  }
}
