import { DrupalNode } from "next-drupal"

export function toUnixMillis(input: string | number | undefined): number {
  if (typeof input === "number") {
    return input * 1000
  }
  if (typeof input === "string") {
    const trimmed = input.trim()
    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed) * 1000
    }
    const parsed = Date.parse(trimmed)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

export function formatDate(input: string | number): string {
  const date = new Date(toUnixMillis(input))
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
  // Ensure trailing slash for static export compatibility
  return path.endsWith('/') ? path : `${path}/`
}

export function extractExcerpt(body: string, maxLength: number = 200): string {
  const normalizedBody = body
    // Replace HTML non-breaking spaces with regular spaces
    .replace(/&nbsp;/gi, " ")
    // Replace unicode non-breaking space characters
    .replace(/\u00a0/g, " ")
  // Strip HTML tags
  const text = normalizedBody.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  // Truncate to maxLength
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + "..."
}
