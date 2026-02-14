import { FaTwitter, FaGithub, FaDrupal } from "react-icons/fa"

export default function Footer() {
  return (
    <footer
      className="mt-16"
      style={{ backgroundColor: 'var(--footer-bg)', color: 'var(--text-primary)' }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p style={{ color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} eiriksm.dev. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <a
              href="https://twitter.com/orkj"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Twitter"
            >
              <FaTwitter size={24} />
            </a>
            <a
              href="https://github.com/eiriksm"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{ color: 'var(--text-muted)' }}
              aria-label="GitHub"
            >
              <FaGithub size={24} />
            </a>
            <a
              href="https://www.drupal.org/u/eiriksm"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{ color: 'var(--text-muted)' }}
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
