import { promises as fs } from "fs"
import path from "path"
import type { DrupalNode } from "@/types/drupal"
import { DrupalJsonApiParams } from "drupal-jsonapi-params"

const DEFAULT_PAGE_SIZE = 50
const PATH_UUID_MAP_FILE = path.join(process.cwd(), ".cache", "path-uuid-map.json")
const TAG_UUID_MAP_FILE = path.join(process.cwd(), ".cache", "tag-uuid-map.json")

type PathUuidMap = Record<string, string>
type TagUuidMap = Record<string, string>
let cachedPathUuidMap: PathUuidMap | null = null
let cachedTagUuidMap: TagUuidMap | null = null

const DRUPAL_BASE_URL = (import.meta.env.PUBLIC_DRUPAL_BASE_URL || process.env.PUBLIC_DRUPAL_BASE_URL || "https://example.com").replace(/\/$/, "")

function getAuthHeaders(): Record<string, string> {
  const username = process.env.BASIC_AUTH_USERNAME
  const password = process.env.BASIC_AUTH_PASSWORD
  if (username && password) {
    const encoded = Buffer.from(`${username}:${password}`).toString("base64")
    return { Authorization: `Basic ${encoded}` }
  }
  return {}
}

/**
 * Deserialize a single JSON:API resource object, flattening attributes
 * and resolving included relationships.
 */
function deserializeResource(resource: any, included?: any[]): any {
  if (!resource) return resource

  const result: any = {
    id: resource.id,
    type: resource.type,
    ...resource.attributes,
  }

  if (resource.relationships && included) {
    const includedMap = new Map<string, any>()
    for (const item of included) {
      includedMap.set(`${item.type}:${item.id}`, item)
    }

    for (const [key, rel] of Object.entries(resource.relationships as Record<string, any>)) {
      const relData = rel?.data
      if (Array.isArray(relData)) {
        result[key] = relData.map((ref: any) => {
          const found = includedMap.get(`${ref.type}:${ref.id}`)
          return found ? deserializeResource(found) : { id: ref.id, type: ref.type }
        })
      } else if (relData) {
        const found = includedMap.get(`${relData.type}:${relData.id}`)
        result[key] = found ? deserializeResource(found) : { id: relData.id, type: relData.type }
      }
    }
  } else if (resource.relationships) {
    for (const [key, rel] of Object.entries(resource.relationships as Record<string, any>)) {
      const relData = rel?.data
      if (Array.isArray(relData)) {
        result[key] = relData.map((ref: any) => ({ id: ref.id, type: ref.type }))
      } else if (relData) {
        result[key] = { id: relData.id, type: relData.type }
      }
    }
  }

  return result
}

async function fetchJsonApi<T>(url: string): Promise<T[]> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.api+json",
      ...getAuthHeaders(),
    },
  })

  if (!response.ok) {
    throw new Error(`JSON:API request failed: ${response.status} ${response.statusText} for ${url}`)
  }

  const json = await response.json()
  const data = json.data || []
  const included = json.included || []

  return data.map((item: any) => deserializeResource(item, included))
}

/**
 * Fetches all resources for a given resource type by paging through results.
 */
/**
 * Flatten nested query objects into bracket-notation keys for JSON:API.
 * e.g. { filter: { status: "1" } } → [["filter[status]", "1"]]
 */
function flattenParams(obj: Record<string, any>, prefix = ""): [string, string][] {
  const entries: [string, string][] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      entries.push(...flattenParams(value, fullKey))
    } else {
      entries.push([fullKey, String(value)])
    }
  }
  return entries
}

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

    const queryString = new URLSearchParams(flattenParams(params)).toString()

    const url = `${DRUPAL_BASE_URL}/jsonapi/${resourceType.replace("--", "/")}?${queryString}`
    const resources = await fetchJsonApi<TResource>(url)

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

/**
 * Fetch a single resource by type and UUID.
 */
export async function getResource<TResource>(
  resourceType: string,
  uuid: string,
  params?: Record<string, string>
): Promise<TResource | null> {
  const queryString = params
    ? new URLSearchParams(params).toString()
    : ""
  const url = `${DRUPAL_BASE_URL}/jsonapi/${resourceType.replace("--", "/")}/${uuid}${queryString ? `?${queryString}` : ""}`

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.api+json",
      ...getAuthHeaders(),
    },
  })

  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(`JSON:API request failed: ${response.status} for ${url}`)
  }

  const json = await response.json()
  if (!json.data) return null
  return deserializeResource(json.data, json.included || [])
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
