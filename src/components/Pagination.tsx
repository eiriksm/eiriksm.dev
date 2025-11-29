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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Previous
        </Link>
      )}

      <span className="text-gray-700">
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages && (
        <Link
          href={getPagePath(currentPage + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Next →
        </Link>
      )}
    </nav>
  )
}
