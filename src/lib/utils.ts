import type { DrupalNode } from "@/types/drupal"

/**
 * Drupal dates come either as unix timestamps in seconds (numbers) or, from
 * JSON:API, as ISO 8601 strings.
 */
export function toDate(input: string | number): Date {
  return new Date(typeof input === "number" ? input * 1000 : input)
}

export function toIsoDate(input: string | number): string {
  return toDate(input).toISOString()
}

export function formatDate(input: string | number): string {
  const date = toDate(input)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function absoluteUrl(input: string) {
  return `${import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || ""}${input}`
}

export function getNodePath(node: DrupalNode): string {
  const fallbackPath = `/node/${node.drupal_internal__nid}`
  const rawPath = node.path?.alias || fallbackPath
  let path = rawPath.trim()

  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      path = new URL(path).pathname
    } else if (path.includes(".") && path.includes("/")) {
      path = new URL(`https://${path}`).pathname
    }
  } catch {
    path = rawPath
  }

  if (!path.startsWith("/")) {
    path = `/${path}`
  }
  if (path === "/") {
    path = fallbackPath
  }
  // Ensure trailing slash for static export compatibility
  return path.endsWith("/") ? path : `${path}/`
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
