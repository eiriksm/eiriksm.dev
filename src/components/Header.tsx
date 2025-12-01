import Link from "next/link"

export default function Header() {
  return (
    <header className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold hover:text-gray-300 transition-colors">
            eiriksm.dev
          </Link>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/" className="hover:text-gray-300 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-gray-300 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/talks" className="hover:text-gray-300 transition-colors">
                  Talks
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}
