import Link from "next/link"

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath?: string
}

export default function Pagination({ currentPage, totalPages, basePath = "/blog" }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPagePath = (page: number) => {
    if (page === 1) return "/"
    return `${basePath}/${page}/`
  }

  return (
    <nav
      className="mt-12 grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4"
      aria-label="Pagination"
    >
      {currentPage > 1 ? (
        <Link
          href={getPagePath(currentPage - 1)}
          className="justify-self-start px-2 py-1 text-[var(--link-color)] hover:text-[var(--link-hover)] transition-colors"
        >
          ← Previous
        </Link>
      ) : (
        <span className="px-2 py-1" aria-hidden="true" />
      )}

      <span className="text-center text-[var(--text-secondary)]">
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link
          href={getPagePath(currentPage + 1)}
          className="justify-self-end px-2 py-1 text-[var(--link-color)] hover:text-[var(--link-hover)] transition-colors"
        >
          Next →
        </Link>
      ) : (
        <span className="px-2 py-1" aria-hidden="true" />
      )}
    </nav>
  )
}
