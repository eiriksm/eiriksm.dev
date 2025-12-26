import { promises as fs } from "fs"
import path from "path"
import { DrupalClient, DrupalNode } from "next-drupal"
import { DrupalJsonApiParams } from "drupal-jsonapi-params"

const DEFAULT_PAGE_SIZE = 50
const PATH_UUID_MAP_FILE = path.join(process.cwd(), ".cache", "path-uuid-map.json")
const TAG_UUID_MAP_FILE = path.join(process.cwd(), ".cache", "tag-uuid-map.json")

type PathUuidMap = Record<string, string>
type TagUuidMap = Record<string, string>
let cachedPathUuidMap: PathUuidMap | null = null
let cachedTagUuidMap: TagUuidMap | null = null

const drupalConfig: any = {}

// Only add auth if credentials are provided
if (process.env.BASIC_AUTH_USERNAME && process.env.BASIC_AUTH_PASSWORD) {
  drupalConfig.auth = {
    username: process.env.BASIC_AUTH_USERNAME,
    password: process.env.BASIC_AUTH_PASSWORD,
  }
}

// Add preview secret if available
if (process.env.DRUPAL_PREVIEW_SECRET) {
  drupalConfig.previewSecret = process.env.DRUPAL_PREVIEW_SECRET
}

export const drupal = new DrupalClient(
  process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || "https://example.com",
  drupalConfig
)

/**
 * Fetches all resources for a given resource type by paging through results.
 */
export async function getAllResources<TResource>(
  resourceType: string,
  paramsBuilder?: DrupalJsonApiParams,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<TResource[]> {
  const allResources: TResource[] = []
  const baseParams = paramsBuilder?.getQueryObject() || {}
  const seenIds = new Set<string>()

  const getResourceId = (resource: TResource) =>
    String((resource as any)?.id ?? "")

  const appendNewResources = (resources: TResource[]) => {
    let added = 0
    for (const resource of resources) {
      const id = getResourceId(resource)
      if (!id || !seenIds.has(id)) {
        if (id) {
          seenIds.add(id)
        }
        allResources.push(resource)
        added += 1
      }
    }
    return added
  }

  let offset = 0
  while (true) {
    const params = {
      ...baseParams,
      "page[limit]": pageSize,
      "page[offset]": offset,
    }

    const resources = await drupal.getResourceCollection<TResource[]>(
      resourceType,
      {
        params,
      }
    )

    if (!resources.length) {
      break
    }

    const added = appendNewResources(resources)
    if (added === 0) {
      break
    }

    offset += resources.length
  }

  return allResources
}

const normalizePath = (value: string | undefined) => {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed) return ""

  let path = trimmed

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      path = new URL(trimmed).pathname
    } else if (trimmed.includes(".") && trimmed.includes("/")) {
      path = new URL(`https://${trimmed}`).pathname
    }
  } catch {
    path = trimmed
  }

  const ensured = path.startsWith("/") ? path : `/${path}`
  return ensured.endsWith("/") ? ensured.slice(0, -1) : ensured
}

function buildPathUuidMap(nodes: DrupalNode[]): PathUuidMap {
  const map: PathUuidMap = {}

  nodes.forEach((node) => {
    const alias = normalizePath((node as any)?.path?.alias)
    const nidPath = normalizePath(`/node/${(node as any).drupal_internal__nid}`)

    if (alias) {
      map[alias] = node.id
    }

    if (nidPath) {
      map[nidPath] = node.id
    }
  })

  return map
}

async function loadPathUuidMapFromDisk(): Promise<PathUuidMap> {
  if (cachedPathUuidMap) {
    return cachedPathUuidMap
  }

  try {
    const data = await fs.readFile(PATH_UUID_MAP_FILE, "utf8")
    const map = (JSON.parse(data) as PathUuidMap) || {}
    cachedPathUuidMap = map
    return map
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      console.warn("[drupal] Failed to read path UUID map:", error)
    }
    cachedPathUuidMap = {}
    return cachedPathUuidMap
  }
}

async function persistPathUuidMap(map: PathUuidMap) {
  await fs.mkdir(path.dirname(PATH_UUID_MAP_FILE), { recursive: true })
  await fs.writeFile(PATH_UUID_MAP_FILE, JSON.stringify(map, null, 2), "utf8")
  cachedPathUuidMap = map
}

export async function ensurePathUuidMap(
  nodes?: DrupalNode[]
): Promise<PathUuidMap> {
  const existing = await loadPathUuidMapFromDisk()
  if (Object.keys(existing).length) {
    return existing
  }

  const sourceNodes =
    nodes || (await getAllResources<DrupalNode>("node--article"))
  const map = buildPathUuidMap(sourceNodes)
  await persistPathUuidMap(map)

  return map
}

export async function addNodesToPathUuidMap(nodes: DrupalNode[]) {
  const freshMap = buildPathUuidMap(nodes)

  // Merge with any existing cached map to avoid losing entries across calls.
  const mergedMap = { ...(cachedPathUuidMap || {}), ...freshMap }
  try {
    await persistPathUuidMap(mergedMap)
  } catch (error) {
    console.warn("[drupal] Failed to persist path UUID map:", error)
  }
}

export { normalizePath }

function buildTagUuidMap(tags: any[]): TagUuidMap {
  const map: TagUuidMap = {}

  tags.forEach((tag) => {
    const tid = (tag?.drupal_internal__tid || tag?.tid)?.toString()

    if (tid && tag?.id) {
      map[tid] = tag.id
    }
  })

  return map
}

async function loadTagUuidMapFromDisk(): Promise<TagUuidMap> {
  if (cachedTagUuidMap) {
    return cachedTagUuidMap
  }

  try {
    const data = await fs.readFile(TAG_UUID_MAP_FILE, "utf8")
    const map = (JSON.parse(data) as TagUuidMap) || {}
    cachedTagUuidMap = map
    return map
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      console.warn("[drupal] Failed to read tag UUID map:", error)
    }
    cachedTagUuidMap = {}
    return cachedTagUuidMap
  }
}

async function persistTagUuidMap(map: TagUuidMap) {
  await fs.mkdir(path.dirname(TAG_UUID_MAP_FILE), { recursive: true })
  await fs.writeFile(TAG_UUID_MAP_FILE, JSON.stringify(map, null, 2), "utf8")
  cachedTagUuidMap = map
}

export async function ensureTagUuidMap(tags?: any[]): Promise<TagUuidMap> {
  const existing = await loadTagUuidMapFromDisk()
  if (Object.keys(existing).length) {
    return existing
  }

  const sourceTags = tags || (await getAllResources<any>("taxonomy_term--tags"))
  const map = buildTagUuidMap(sourceTags)
  await persistTagUuidMap(map)

  return map
}
