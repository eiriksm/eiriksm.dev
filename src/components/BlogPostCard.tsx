import Link from "next/link"
import { DrupalNode } from "next-drupal"
import { formatDate, getNodePath, extractExcerpt } from "@/lib/utils"

interface BlogPostCardProps {
  node: DrupalNode
}

export default function BlogPostCard({ node }: BlogPostCardProps) {
  const path = getNodePath(node)
  const excerpt = node.body?.summary || extractExcerpt(node.body?.value || "")
  const tags = node.field_tags || []

  return (
    <article className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-3">
          <Link href={path} className="text-gray-900 hover:text-blue-600 transition-colors">
            {node.title}
          </Link>
        </h2>

        <div className="text-sm text-gray-500 mb-4">
          <time dateTime={new Date(node.created).toISOString()}>
            {formatDate(node.created)}
          </time>
        </div>

        {excerpt && (
          <p className="text-gray-700 mb-4 line-clamp-3">
            {excerpt}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
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

        <Link
          href={path}
          className="inline-block text-blue-600 hover:text-blue-800 font-medium"
        >
          Read more →
        </Link>
      </div>
    </article>
  )
}
