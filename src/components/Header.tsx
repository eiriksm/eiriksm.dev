import Link from "next/link"
import DarkModeToggle from "./DarkModeToggle"

interface HeaderProps {
  showBlogHeader?: boolean
  blogTitle?: string
  blogSubtitle?: string
}

export default function Header({
  showBlogHeader = false,
  blogTitle = "eiriksm.dev",
  blogSubtitle = "Thoughts on building for the web"
}: HeaderProps) {
  return (
    <header style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {showBlogHeader ? (
          <div className="blog-header">
            <div className="blog-header-content">
              <h1>
                <Link href="/" style={{ textDecoration: 'none' }}>
                  {blogTitle}
                </Link>
              </h1>
              {blogSubtitle && <p>{blogSubtitle}</p>}
            </div>
            <DarkModeToggle />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-bold transition-colors"
              style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
            >
              eiriksm.dev
            </Link>
            <div className="flex items-center gap-6">
              <nav>
                <ul className="flex space-x-6">
                  <li>
                    <Link
                      href="/"
                      className="transition-colors"
                      style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className="transition-colors"
                      style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/talks"
                      className="transition-colors"
                      style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                    >
                      Talks
                    </Link>
                  </li>
                </ul>
              </nav>
              <DarkModeToggle />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
