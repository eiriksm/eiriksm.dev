import { promises as fs } from "fs"
import path from "path"
import type { DrupalNode } from "@/types/drupal"
import { getNodePath } from "@/lib/utils"

const SITE_URL = ((import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL) || "https://eiriksm.dev").replace(/\/$/, "")
const FEED_TITLE = "eiriksm.dev Planet Drupal feed"
const FEED_DESCRIPTION = "Posts tagged \"planet drupal\" from eiriksm.dev"

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function formatDate(input: string | number): string {
  const timestamp = typeof input === "number" ? input * 1000 : input
  return new Date(timestamp).toUTCString()
}

function hasPlanetTag(node: DrupalNode): boolean {
  const tags = (node as any)?.field_tags || []

  return tags.some((tag: any) => {
    const name = (tag?.name || "").toLowerCase()
    return name === "planet drupal" || name === "planet-drupal" || tag?.drupal_internal__tid === 1
  })
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

function buildFeed(nodes: DrupalNode[]): string {
  const items = nodes.map((node) => {
    const nodePath = getNodePath(node)
    const url = stripTrailingSlash(`${SITE_URL}${nodePath}`)
    const contentEncoded = node.body?.value || ""
    const pubDate = formatDate(node.created as any)
    const categories = ((node as any)?.field_tags || [])
      .map((tag: any) => tag?.name)
      .filter(Boolean)
      .map((name: string) => `    <category>${escapeXml(name)}</category>`)
      .join("\n")

    return [
      "  <item>",
      `    <title>${escapeXml(node.title || "Untitled post")}</title>`,
      `    <link>${url}</link>`,
      `    <guid isPermaLink="true">${url}</guid>`,
      `    <pubDate>${pubDate}</pubDate>`,
      categories,
      `    <content:encoded><![CDATA[${contentEncoded}]]></content:encoded>`,
      "  </item>",
    ]
      .filter(Boolean)
      .join("\n")
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0">',
    "  <channel>",
    `    <title>${escapeXml(FEED_TITLE)}</title>`,
    `    <link>${SITE_URL}/</link>`,
    `    <description>${escapeXml(FEED_DESCRIPTION)}</description>`,
    "    <language>en-US</language>",
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    items.join("\n"),
    "  </channel>",
    "</rss>",
    "",
  ].join("\n")
}

async function writeFeedFile(targetPath: string, contents: string) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true })
  await fs.writeFile(targetPath, contents, "utf8")
}

export async function generatePlanetFeed(nodes: DrupalNode[]) {
  const planetNodes = nodes.filter(hasPlanetTag).sort((a, b) => {
    const aDate = typeof a.created === "number" ? a.created * 1000 : Date.parse((a.created as unknown as string) || "")
    const bDate = typeof b.created === "number" ? b.created * 1000 : Date.parse((b.created as unknown as string) || "")
    return bDate - aDate
  })

  const feed = buildFeed(planetNodes)
  console.log(`[planet] Generated RSS feed with ${planetNodes.length} entries`)
  const targets = [
    path.join(process.cwd(), "public", "planet"),
    path.join(process.cwd(), "public", "planet.xml"),
  ]

  await Promise.all(targets.map((target) => writeFeedFile(target, feed)))
}
