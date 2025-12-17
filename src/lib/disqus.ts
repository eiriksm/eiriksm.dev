import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { XMLParser } from "fast-xml-parser"

export interface DisqusComment {
  id: string
  author: string
  authorEmail?: string
  body: string
  createdAt: string
  isAnonymous: boolean
}

interface DisqusData {
  counts: Map<string, number>
  comments: Map<string, DisqusComment[]>
}

let disqusCache: DisqusData | null = null

/**
 * Parse disqus.xml and return comment data by URL path
 */
function parseDisqusData(): DisqusData {
  if (disqusCache) {
    return disqusCache
  }

  const counts = new Map<string, number>()
  const comments = new Map<string, DisqusComment[]>()
  const disqusPath = join(process.cwd(), "disqus.xml")

  if (!existsSync(disqusPath)) {
    disqusCache = { counts, comments }
    return disqusCache
  }

  try {
    const xmlContent = readFileSync(disqusPath, "utf-8")
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    })
    const result = parser.parse(xmlContent)

    if (!result.disqus) {
      disqusCache = { counts, comments }
      return disqusCache
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

    // Parse posts (comments)
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
            // Update count
            const currentCount = counts.get(path) || 0
            counts.set(path, currentCount + 1)

            // Extract comment data
            const isAnonymous = post.author?.isAnonymous === "true" || post.author?.isAnonymous === true
            const comment: DisqusComment = {
              id: post["@_dsq:id"] || `disqus-${Date.now()}-${Math.random()}`,
              author: isAnonymous
                ? (post.author?.name || "Anonymous")
                : (post.author?.name || post.author?.username || "Unknown"),
              authorEmail: post.author?.email,
              body: post.message || "",
              createdAt: post.createdAt || new Date().toISOString(),
              isAnonymous,
            }

            // Add to comments map
            const pathComments = comments.get(path) || []
            pathComments.push(comment)
            comments.set(path, pathComments)
          }
        }
      }
    }

    // Sort comments by date (oldest first)
    for (const [path, pathComments] of comments) {
      pathComments.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }

    console.log(`[disqus] Parsed ${counts.size} threads with comments from disqus.xml`)
  } catch (error) {
    console.warn("[disqus] Failed to parse disqus.xml:", error)
  }

  disqusCache = { counts, comments }
  return disqusCache
}

/**
 * Normalize path for matching
 */
function normalizePath(path: string): string {
  // Remove trailing slash for consistent matching
  return path.endsWith("/") ? path.slice(0, -1) : path
}

/**
 * Find comments for a path (tries various path formats)
 */
function findForPath<T>(map: Map<string, T>, path: string): T | undefined {
  const normalized = normalizePath(path)

  // Try exact match
  if (map.has(normalized)) {
    return map.get(normalized)
  }

  // Try with trailing slash
  if (map.has(normalized + "/")) {
    return map.get(normalized + "/")
  }

  // Try original path
  if (map.has(path)) {
    return map.get(path)
  }

  return undefined
}

/**
 * Get comment count for a specific path from disqus.xml
 */
export function getDisqusCommentCount(path: string): number {
  const { counts } = parseDisqusData()
  return findForPath(counts, path) || 0
}

/**
 * Get full comments for a specific path from disqus.xml
 */
export function getDisqusComments(path: string): DisqusComment[] {
  const { comments } = parseDisqusData()
  return findForPath(comments, path) || []
}
