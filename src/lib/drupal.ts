import { DrupalClient } from "next-drupal"

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
