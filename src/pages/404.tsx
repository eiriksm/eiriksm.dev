import Link from "next/link"
import Head from "next/head"

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found | eiriksm.dev</title>
        <meta name="description" content="Page not found" />
      </Head>

      <div className="max-w-4xl mx-auto text-center py-16">
        <h1 className="text-6xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>404</h1>
        <h2 className="text-3xl font-semibold mb-6" style={{ color: 'var(--text-secondary)' }}>Page Not Found</h2>
        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
          Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block text-white px-6 py-3 rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--accent-color)' }}
        >
          Go Back Home
        </Link>
      </div>
    </>
  )
}
