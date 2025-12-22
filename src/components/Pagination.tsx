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
    <nav className="flex justify-center items-center space-x-4 mt-12" aria-label="Pagination">
      {currentPage > 1 && (
        <Link
          href={getPagePath(currentPage - 1)}
          className="px-4 py-2 bg-[var(--accent-color)] text-[var(--tag-text)] rounded-none border border-[var(--accent-color)] hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)] transition-colors"
        >
          ← Previous
        </Link>
      )}

      <span className="text-[var(--text-secondary)]">
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages && (
        <Link
          href={getPagePath(currentPage + 1)}
          className="px-4 py-2 bg-[var(--accent-color)] text-[var(--tag-text)] rounded-none border border-[var(--accent-color)] hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)] transition-colors"
        >
          Next →
        </Link>
      )}
    </nav>
  )
}
