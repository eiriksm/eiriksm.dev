export interface DrupalNode {
  id: string
  type: string
  title: string
  body?: {
    value?: string
    summary?: string
  }
  created: string | number
  path?: {
    alias?: string
  }
  field_tags?: any[]
  field_image?: {
    uri?: {
      url?: string
    }
  }
  field_issue_comment_id?: string
  drupal_internal__nid: number
  [key: string]: any
}
