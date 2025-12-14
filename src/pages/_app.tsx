import type { AppProps } from "next/app"
import Head from "next/head"
import Script from "next/script"
import "@/styles/globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import Analytics from "@/components/Analytics"

export default function App({ Component, pageProps }: AppProps) {
  // Check if this is a blog listing page
  const isBlogListing = pageProps.isBlogListing ?? false

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="author" content="Eirik S. Morland" />
        <meta name="keywords" content="Drupal, Development, Blog, PHP, JavaScript" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:url" content="https://eiriksm.dev" />
        <meta property="og:site_name" content="eiriksm.dev" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@orkj" />
        <meta name="twitter:creator" content="@orkj" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="eiriksm.dev Planet Drupal feed"
          href="/planet"
        />
      </Head>
      {/* Inline script to prevent flash of wrong theme */}
      <Script
        id="theme-script"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var savedTheme = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            })();
          `,
        }}
      />
      <Analytics />
      <div className="flex flex-col min-h-screen">
        <Header showBlogHeader={isBlogListing} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
    </>
  )
}
