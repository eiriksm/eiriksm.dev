import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About",
  description: "About eiriksm.dev and Eirik S. Morland",
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">About eiriksm.dev</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-700 leading-relaxed mb-6">
          Welcome to my personal blog where I write about Drupal development,
          PHP, JavaScript, and web technologies.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">About Me</h2>
        <p className="text-gray-700 leading-relaxed">
          I'm Eirik S. Morland, a developer passionate about building great web experiences.
          I primarily work with Drupal and contribute to the open-source community.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">Connect</h2>
        <ul className="list-disc ml-6 text-gray-700">
          <li>
            <a
              href="https://twitter.com/orkj"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              Twitter: @orkj
            </a>
          </li>
          <li>
            <a
              href="https://github.com/eiriksm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              GitHub: @eiriksm
            </a>
          </li>
          <li>
            <a
              href="https://www.drupal.org/u/eiriksm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              Drupal.org: eiriksm
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}
