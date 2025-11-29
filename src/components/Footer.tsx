import { FaTwitter, FaGithub, FaDrupal } from "react-icons/fa"

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-400">
              © {new Date().getFullYear()} eiriksm.dev. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <a
              href="https://twitter.com/orkj"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors"
              aria-label="Twitter"
            >
              <FaTwitter size={24} />
            </a>
            <a
              href="https://github.com/eiriksm"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-400 transition-colors"
              aria-label="GitHub"
            >
              <FaGithub size={24} />
            </a>
            <a
              href="https://www.drupal.org/u/eiriksm"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition-colors"
              aria-label="Drupal"
            >
              <FaDrupal size={24} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
