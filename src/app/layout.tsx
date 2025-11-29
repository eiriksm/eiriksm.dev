import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import Analytics from "@/components/Analytics"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "eiriksm.dev",
    template: "%s | eiriksm.dev",
  },
  description: "eiriksm.dev: Drupal blog for eiriksm.",
  authors: [{ name: "Eirik S. Morland", url: "https://twitter.com/orkj" }],
  keywords: ["Drupal", "Development", "Blog", "PHP", "JavaScript"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://eiriksm.dev",
    siteName: "eiriksm.dev",
    title: "eiriksm.dev",
    description: "eiriksm.dev: Drupal blog for eiriksm.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@orkj",
    creator: "@orkj",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Analytics />
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
