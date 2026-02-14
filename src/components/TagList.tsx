import Link from "next/link"

interface TagListProps {
  tags: any[]
  className?: string
}

export default function TagList({ tags, className = "" }: TagListProps) {
  if (!tags?.length) {
    return null
  }

  return (
    <div className={`tags-list ${className}`.trim()}>
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
  )
}
