import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { XMLParser } from "fast-xml-parser"

interface DisqusThread {
  id: string
  link: string
  commentCount: number
}

let disqusCache: Map<string, number> | null = null

/**
 * Parse disqus.xml and return comment counts by URL path
 */
export function parseDisqusComments(): Map<string, number> {
  if (disqusCache) {
    return disqusCache
  }

  const commentCounts = new Map<string, number>()
  const disqusPath = join(process.cwd(), "disqus.xml")

  if (!existsSync(disqusPath)) {
    disqusCache = commentCounts
    return commentCounts
  }

  try {
    const xmlContent = readFileSync(disqusPath, "utf-8")
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    })
    const result = parser.parse(xmlContent)

    if (!result.disqus) {
      disqusCache = commentCounts
      return commentCounts
    }

    // Build thread ID to link mapping
    const threadLinks = new Map<string, string>()
    const threads = result.disqus.thread
    if (threads) {
      const threadArray = Array.isArray(threads) ? threads : [threads]
      for (const thread of threadArray) {
        const threadId = thread["@_dsq:id"]
        const link = thread.link
        if (threadId && link) {
          // Extract path from URL
          try {
            const url = new URL(link)
            threadLinks.set(threadId, url.pathname)
          } catch {
            // If not a valid URL, use as-is
            threadLinks.set(threadId, link)
          }
        }
      }
    }

    // Count posts per thread
    const posts = result.disqus.post
    if (posts) {
      const postArray = Array.isArray(posts) ? posts : [posts]
      for (const post of postArray) {
        // Skip deleted posts
        if (post.isDeleted === "true" || post.isDeleted === true) {
          continue
        }
        // Skip spam posts
        if (post.isSpam === "true" || post.isSpam === true) {
          continue
        }

        const threadRef = post.thread?.["@_dsq:id"]
        if (threadRef) {
          const path = threadLinks.get(threadRef)
          if (path) {
            const currentCount = commentCounts.get(path) || 0
            commentCounts.set(path, currentCount + 1)
          }
        }
      }
    }

    console.log(`[disqus] Parsed ${commentCounts.size} threads with comments from disqus.xml`)
  } catch (error) {
    console.warn("[disqus] Failed to parse disqus.xml:", error)
  }

  disqusCache = commentCounts
  return commentCounts
}

/**
 * Get comment count for a specific path from disqus.xml
 */
export function getDisqusCommentCount(path: string): number {
  const counts = parseDisqusComments()

  // Try exact match first
  if (counts.has(path)) {
    return counts.get(path)!
  }

  // Try with trailing slash
  if (counts.has(path + "/")) {
    return counts.get(path + "/")!
  }

  // Try without trailing slash
  if (path.endsWith("/") && counts.has(path.slice(0, -1))) {
    return counts.get(path.slice(0, -1))!
  }

  return 0
}
