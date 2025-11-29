import { drupal } from "@/lib/drupal"
import { DrupalNode } from "next-drupal"
import BlogPostCard from "@/components/BlogPostCard"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { DrupalJsonApiParams } from "drupal-jsonapi-params"

interface TagPageProps {
  params: Promise<{
    tid: string
  }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tid } = await params

  try {
    const term = await drupal.getResource(
      "taxonomy_term--tags",
      tid
    )

    if (!term) {
      return {}
    }

    return {
      title: `Posts tagged "${term.name}"`,
      description: `All posts tagged with ${term.name}`,
    }
  } catch (error) {
    return {}
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { tid } = await params

  let term
  try {
    term = await drupal.getResource(
      "taxonomy_term--tags",
      tid
    )
  } catch (error) {
    notFound()
  }

  if (!term) {
    notFound()
  }

  // Fetch all articles
  const apiParams = new DrupalJsonApiParams()
  apiParams.addSort("created", "DESC")
  apiParams.addInclude(["field_tags"])

  const allNodes = await drupal.getResourceCollectionFromContext<DrupalNode>(
    "node--article",
    {
      params: apiParams.getQueryObject(),
    }
  )

  // Filter nodes that have this tag
  const nodes = allNodes.filter((node: any) => {
    return node.field_tags?.some((tag: any) => tag.drupal_internal__tid === parseInt(tid))
  })

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Posts tagged "{term.name}"
        </h1>
        <p className="text-gray-600 mt-2">
          {nodes.length} {nodes.length === 1 ? "post" : "posts"} found
        </p>
      </header>

      <div className="space-y-8">
        {nodes.map((node) => (
          <BlogPostCard key={node.id} node={node} />
        ))}
      </div>

      {nodes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No posts found with this tag.</p>
        </div>
      )}
    </div>
  )
}

export async function generateStaticParams() {
  try {
    const terms = await drupal.getResourceCollection(
      "taxonomy_term--tags",
      {}
    )

    return terms.map((term: any) => ({
      tid: term.drupal_internal__tid?.toString() || term.id,
    }))
  } catch (error) {
    console.warn('Failed to generate static params for tags:', error)
    return []
  }
}
