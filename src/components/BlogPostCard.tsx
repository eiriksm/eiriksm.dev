import Link from "next/link"
import { DrupalNode } from "next-drupal"
import { formatDate, getNodePath, extractExcerpt } from "@/lib/utils"
import { FaComment } from "react-icons/fa"
import { HiArrowRight } from "react-icons/hi"

interface BlogPostCardProps {
  node: DrupalNode
  commentCount?: number
}

export default function BlogPostCard({ node, commentCount = 0 }: BlogPostCardProps) {
  const path = getNodePath(node)
  const excerpt = node.body?.summary || extractExcerpt(node.body?.value || "")
  const tags = node.field_tags || []

  return (
    <article className="article-card node node--view-mode-teaser">
      <h2 className="card-title node__title">
        <Link href={path}>
          {node.title}
        </Link>
      </h2>

      <div className="card-meta">
        <time dateTime={new Date((node.created as unknown as number) * 1000).toISOString()}>
          {formatDate(node.created)}
        </time>
      </div>

      {excerpt && (
        <p className="card-excerpt line-clamp-3">
          {excerpt}
        </p>
      )}

      {tags.length > 0 && (
        <div className="tags-list clearfix field-type-taxonomy-term-reference">
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

      <div className="card-footer">
        <div className="card-stats">
          <div className="comment-count">
            <FaComment />
            <span>{commentCount}</span>
          </div>
        </div>
        <Link href={path} className="read-article-link">
          Read article <HiArrowRight />
        </Link>
      </div>
    </article>
  )
}
