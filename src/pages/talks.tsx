import Head from "next/head"
import { FaVideo, FaDesktop, FaExternalLinkAlt } from "react-icons/fa"

interface Talk {
  title: string
  event: string
  date: string
  videoUrl?: string
  slidesUrl?: string
}

const talks: Talk[] = [
  {
    title: "Content-driven ecommerce with Drupal Commerce",
    event: "Drupal Dev Days Cluj",
    date: "2019-06",
    slidesUrl: "https://eiriksm.github.io/content-driven-ecommerce-ddd19/",
    videoUrl: "https://drupal.tv/external-video/2019-07-18/content-driven-ecommerce-drupal-commerce",
  },
  {
    title: "Automated updates with Violinist.io",
    event: "Drupal Camp Oslo",
    date: "2018-11",
    slidesUrl: "https://eiriksm.github.io/violinist-dcoslo/",
  },
  {
    title: "Commerce 2 / Akademika.no case study",
    event: "Drupal Camp Oslo",
    date: "2018-11",
  },
  {
    title: "Drupal and Internet of Things",
    event: "Drupal Camp Oslo",
    date: "2015-11",
  },
]

function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split("-")
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long" })
}

export default function TalksPage() {
  return (
    <>
      <Head>
        <title>Talks | eiriksm.dev</title>
        <meta name="description" content="Conference talks and presentations by Eirik S. Morland" />
      </Head>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>Talks & Presentations</h1>

        <div className="prose prose-lg max-w-none mb-8">
          <p className="text-xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            A collection of my conference talks, presentations, and speaking engagements
            at Drupal events and meetups.
          </p>
        </div>

        <div className="space-y-4">
          {talks.map((talk, index) => (
            <div
              key={index}
              className="talk-card p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
            >
              <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                {talk.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <span>{talk.event}</span>
                <span>•</span>
                <span>{formatDate(talk.date)}</span>
              </div>
              {(talk.videoUrl || talk.slidesUrl) && (
                <div className="flex gap-4 mt-3">
                  {talk.videoUrl && (
                    <a
                      href={talk.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                    >
                      <FaVideo className="w-4 h-4" />
                      <span>Watch video</span>
                    </a>
                  )}
                  {talk.slidesUrl && (
                    <a
                      href={talk.slidesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm hover:opacity-80"
                      style={{ color: 'var(--accent-color)' }}
                    >
                      <FaDesktop className="w-4 h-4" />
                      <span>View slides</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Podcast Appearances</h2>
          <ul className="space-y-2">
            <li>
              <a
                href="https://talkingdrupal.com/443"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:underline"
                style={{ color: 'var(--accent-color)' }}
              >
                Talking Drupal #443 - Violinist.io
                <FaExternalLinkAlt className="w-3 h-3" />
              </a>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Discussing automated Composer dependency updates
              </p>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
