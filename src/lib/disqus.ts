import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { XMLParser } from "fast-xml-parser"

export interface DisqusComment {
  id: string
  author: string
  body: string
  createdAt: string
  isAnonymous: boolean
}

interface DisqusData {
  counts: Map<string, number>
  comments: Map<string, DisqusComment[]>
}

const PATH_UUID_MAP_FILE = join(process.cwd(), ".cache", "path-uuid-map.json")

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
  const pathUuidMap = loadPathUuidMapFromDisk()
  const uuidToPathMap = buildUuidToPathMap(pathUuidMap)

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
        const threadUuid = extractUuidFromThread(thread)
        if (threadId && link) {
          const path = extractPathFromLink(link)
          if (path) {
            threadLinks.set(threadId, normalizePath(path))
            continue
          }
        }

        if (threadId) {
          const uuidPath = threadUuid ? uuidToPathMap.get(threadUuid) : undefined
          if (uuidPath) {
            threadLinks.set(threadId, normalizePath(uuidPath))
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
    for (const [, pathComments] of comments) {
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

type PathUuidMap = Record<string, string>

function loadPathUuidMapFromDisk(): PathUuidMap {
  if (!existsSync(PATH_UUID_MAP_FILE)) {
    return {}
  }

  try {
    const data = readFileSync(PATH_UUID_MAP_FILE, "utf8")
    const map = (JSON.parse(data) as PathUuidMap) || {}
    return map
  } catch (error) {
    console.warn("[disqus] Failed to read path UUID map:", error)
    return {}
  }
}

function buildUuidToPathMap(pathUuidMap: PathUuidMap): Map<string, string> {
  const uuidMap = new Map<string, string>()

  for (const [path, uuid] of Object.entries(pathUuidMap)) {
    if (!uuid) {
      continue
    }

    const normalizedPath = normalizePath(path)
    if (!normalizedPath) {
      continue
    }

    const existing = uuidMap.get(uuid)
    if (!existing) {
      uuidMap.set(uuid, normalizedPath)
      continue
    }

    const existingIsNodePath = existing.startsWith("/node/")
    const nextIsNodePath = normalizedPath.startsWith("/node/")
    if (existingIsNodePath && !nextIsNodePath) {
      uuidMap.set(uuid, normalizedPath)
      continue
    }

    if (!existingIsNodePath && nextIsNodePath) {
      continue
    }

    if (normalizedPath.length < existing.length) {
      uuidMap.set(uuid, normalizedPath)
    }
  }

  return uuidMap
}

const UUID_REGEX =
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/

function extractUuidFromThread(thread: any): string | undefined {
  const explicitId = typeof thread?.id === "string" ? thread.id.trim() : ""
  if (explicitId && UUID_REGEX.test(explicitId)) {
    return explicitId
  }

  const link = typeof thread?.link === "string" ? thread.link : ""
  const match = link.match(UUID_REGEX)
  return match?.[0]
}

/**
 * Normalize path for matching
 */
function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) {
    return ""
  }
  const ensured = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  return ensured.endsWith("/") ? ensured.slice(0, -1) : ensured
}

function extractPathFromLink(link: string): string {
  try {
    return new URL(link).pathname
  } catch {
    try {
      return new URL(`https://${link}`).pathname
    } catch {
      return ""
    }
  }
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
