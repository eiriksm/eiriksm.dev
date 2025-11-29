import { DrupalNode } from "next-drupal"

export function formatDate(input: string | number): string {
  // Drupal timestamps are in seconds, convert to milliseconds
  const timestamp = typeof input === 'number' ? input * 1000 : input
  const date = new Date(timestamp)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function absoluteUrl(input: string) {
  return `${process.env.NEXT_PUBLIC_SITE_URL}${input}`
}

export function getNodePath(node: DrupalNode): string {
  const path = node.path?.alias || `/node/${node.drupal_internal__nid}`
  return path
}

export function extractExcerpt(body: string, maxLength: number = 200): string {
  // Strip HTML tags
  const text = body.replace(/<[^>]*>/g, "")
  // Truncate to maxLength
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + "..."
}
