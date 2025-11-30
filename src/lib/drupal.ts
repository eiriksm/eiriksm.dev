import { DrupalClient } from "next-drupal"
import { DrupalJsonApiParams } from "drupal-jsonapi-params"

const DEFAULT_PAGE_SIZE = 50

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

    allResources.push(...resources)

    if (resources.length < pageSize) {
      break
    }

    offset += pageSize
  }

  return allResources
}
