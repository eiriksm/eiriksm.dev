import Head from "next/head"

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About | eiriksm.dev</title>
        <meta name="description" content="About eiriksm.dev and Eirik S. Morland" />
      </Head>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>About eiriksm.dev</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-xl leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            Welcome to my personal blog where I write about Drupal development,
            PHP, JavaScript, and web technologies.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: 'var(--text-primary)' }}>About Me</h2>
          <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            I&apos;m Eirik S. Morland, a developer passionate about building great web experiences.
            I primarily work with Drupal and contribute to the open-source community.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: 'var(--text-primary)' }}>Connect</h2>
          <ul className="list-disc ml-6" style={{ color: 'var(--text-secondary)' }}>
            <li>
              <a
                href="https://twitter.com/orkj"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-color)' }}
                className="hover:opacity-80"
              >
                Twitter: @orkj
              </a>
            </li>
            <li>
              <a
                href="https://github.com/eiriksm"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-color)' }}
                className="hover:opacity-80"
              >
                GitHub: @eiriksm
              </a>
            </li>
            <li>
              <a
                href="https://www.drupal.org/u/eiriksm"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-color)' }}
                className="hover:opacity-80"
              >
                Drupal.org: eiriksm
              </a>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
