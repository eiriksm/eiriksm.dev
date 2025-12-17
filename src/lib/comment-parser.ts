import { marked } from "marked"
import * as emoji from "node-emoji"

// Configure marked for safe rendering
marked.setOptions({
  gfm: true,
  breaks: true,
})

/**
 * Parse emoji shortcodes like :smile: into actual emojis
 */
export function parseEmojis(text: string): string {
  return emoji.emojify(text)
}

/**
 * Parse markdown to HTML
 */
export function parseMarkdown(text: string): string {
  try {
    return marked.parse(text, { async: false }) as string
  } catch {
    return text
  }
}

/**
 * Parse comment body: first convert emoji shortcodes, then markdown
 */
export function parseCommentBody(text: string): string {
  // First parse emojis (before markdown, so :emoji: doesn't get escaped)
  const withEmojis = parseEmojis(text)
  // Then parse markdown
  return parseMarkdown(withEmojis)
}
