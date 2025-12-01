import Link from "next/link"
import { DrupalNode } from "next-drupal"
import { formatDate, getNodePath, extractExcerpt } from "@/lib/utils"
import TagList from "./TagList"

interface BlogPostCardProps {
  node: DrupalNode
}

export default function BlogPostCard({ node }: BlogPostCardProps) {
  const path = getNodePath(node)
  const excerpt = node.body?.summary || extractExcerpt(node.body?.value || "")
  const tags = node.field_tags || []

  return (
    <article className="bg-white rounded-lg overflow-hidden">
      <div className="py-6">
        <h2 className="node__title text-2xl font-bold mb-3 px-4">
          <Link href={path} className="text-gray-900 hover:text-blue-600 transition-colors">
            {node.title}
          </Link>
        </h2>

        <div className="text-sm text-gray-500 mb-4 px-4">
          <time dateTime={new Date((node.created as unknown as number) * 1000).toISOString()}>
            {formatDate(node.created)}
          </time>
        </div>

        {excerpt && (
          <p className="text-gray-700 mb-4 line-clamp-3 px-4">
            {excerpt}
          </p>
        )}

        <TagList tags={tags} className="mb-4 px-4" />

        <Link
          href={path}
          className="inline-block text-blue-600 hover:text-blue-800 font-medium px-4"
        >
          Read more →
        </Link>
      </div>
    </article>
  )
}
