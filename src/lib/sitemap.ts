import { promises as fs } from "fs"
import path from "path"
import type { DrupalNode } from "@/types/drupal"
import { getNodePath } from "@/lib/utils"

const SITE_URL = ((import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL) || "https://eiriksm.dev").replace(/\/$/, "")
const POSTS_PER_PAGE = 10

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function formatDateW3C(input: string | number): string {
  const timestamp = typeof input === "number" ? input * 1000 : input
  return new Date(timestamp).toISOString()
}

function buildSitemap(nodes: DrupalNode[], tags: any[]): string {
  const urls: string[] = []

  // Homepage
  urls.push(buildUrl(`${SITE_URL}/`, undefined, "daily", "1.0"))

  // Static pages
  urls.push(buildUrl(`${SITE_URL}/about/`, undefined, "monthly", "0.5"))
  urls.push(buildUrl(`${SITE_URL}/talks/`, undefined, "monthly", "0.5"))

  // Blog pagination pages
  const totalPages = Math.ceil(nodes.length / POSTS_PER_PAGE)
  for (let page = 2; page <= totalPages; page++) {
    urls.push(buildUrl(`${SITE_URL}/blog/${page}/`, undefined, "daily", "0.5"))
  }

  // Individual blog posts
  for (const node of nodes) {
    const nodePath = getNodePath(node)
    const lastmod = node.created ? formatDateW3C(node.created as any) : undefined
    urls.push(buildUrl(`${SITE_URL}${nodePath}`, lastmod, "daily", "0.7"))
  }

  // Tag pages
  for (const tag of tags) {
    const tid = tag?.drupal_internal__tid || tag?.tid
    if (tid) {
      urls.push(buildUrl(`${SITE_URL}/tag/${tid}/`, undefined, "weekly", "0.3"))
    }
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n")
}

function buildUrl(loc: string, lastmod?: string, changefreq?: string, priority?: string): string {
  const parts = [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
  ]
  if (lastmod) {
    parts.push(`    <lastmod>${lastmod}</lastmod>`)
  }
  if (changefreq) {
    parts.push(`    <changefreq>${changefreq}</changefreq>`)
  }
  if (priority) {
    parts.push(`    <priority>${priority}</priority>`)
  }
  parts.push("  </url>")
  return parts.join("\n")
}

export async function generateSitemap(nodes: DrupalNode[], tags: any[]) {
  const sortedNodes = nodes
    .slice()
    .sort((a, b) => {
      const aDate = typeof a.created === "number" ? a.created * 1000 : Date.parse((a.created as unknown as string) || "")
      const bDate = typeof b.created === "number" ? b.created * 1000 : Date.parse((b.created as unknown as string) || "")
      return bDate - aDate
    })

  const xml = buildSitemap(sortedNodes, tags)
  const targetPath = path.join(process.cwd(), "public", "sitemap.xml")
  await fs.mkdir(path.dirname(targetPath), { recursive: true })
  await fs.writeFile(targetPath, xml, "utf8")
  console.log(`[sitemap] Generated sitemap with ${sortedNodes.length} posts, ${tags.length} tags`)
}
