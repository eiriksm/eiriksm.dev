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
    <div className={`field-type-taxonomy-term-reference ${className}`.trim()}>
      <ul className="links field-items flex flex-wrap gap-2 list-none p-0 m-0">
        {tags.map((tag: any) => (
          <li key={tag.id}>
            <Link
              href={`/tag/${tag.drupal_internal__tid}/`}
              className="tag inline-block"
            >
              {tag.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
