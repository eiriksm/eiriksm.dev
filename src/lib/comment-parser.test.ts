import { describe, it, expect } from 'vitest'
import { parseEmojis, parseMarkdown, parseCommentBody } from './comment-parser'

describe('parseEmojis', () => {
  it('converts emoji shortcodes to emojis', () => {
    expect(parseEmojis(':smile:')).toBe('😄')
    expect(parseEmojis(':heart:')).toBe('❤️')
    expect(parseEmojis(':+1:')).toBe('👍')
  })

  it('converts multiple emoji shortcodes', () => {
    expect(parseEmojis(':smile: :heart:')).toBe('😄 ❤️')
  })

  it('handles cocktail emoji', () => {
    expect(parseEmojis(':cocktail:')).toBe('🍸')
  })

  it('handles scream emoji', () => {
    expect(parseEmojis(':scream:')).toBe('😱')
  })

  it('handles racehorse emoji', () => {
    expect(parseEmojis(':racehorse:')).toBe('🐎')
  })

  it('preserves text without emoji shortcodes', () => {
    expect(parseEmojis('Hello world')).toBe('Hello world')
  })

  it('preserves unknown shortcodes', () => {
    expect(parseEmojis(':unknown_emoji_xyz:')).toBe(':unknown_emoji_xyz:')
  })

  it('handles emojis mixed with text', () => {
    expect(parseEmojis('Cool and unorthodox :cocktail:')).toBe('Cool and unorthodox 🍸')
  })
})

describe('parseMarkdown', () => {
  it('converts links to HTML', () => {
    const result = parseMarkdown('[Drupal](https://drupal.org)')
    expect(result).toContain('<a href="https://drupal.org"')
    expect(result).toContain('Drupal</a>')
  })

  it('converts inline code to HTML', () => {
    const result = parseMarkdown('Use `ExistingSiteSelenium2DriverTest`')
    expect(result).toContain('<code>ExistingSiteSelenium2DriverTest</code>')
  })

  it('converts bold text', () => {
    const result = parseMarkdown('This is **bold**')
    expect(result).toContain('<strong>bold</strong>')
  })

  it('converts italic text', () => {
    const result = parseMarkdown('This is *italic*')
    expect(result).toContain('<em>italic</em>')
  })

  it('handles code blocks', () => {
    const result = parseMarkdown('```\ncode here\n```')
    expect(result).toContain('<pre>')
    expect(result).toContain('<code>')
  })

  it('preserves plain text', () => {
    const result = parseMarkdown('Hello world')
    expect(result).toContain('Hello world')
  })

  it('handles multiple paragraphs', () => {
    const result = parseMarkdown('First paragraph\n\nSecond paragraph')
    expect(result).toContain('<p>First paragraph</p>')
    expect(result).toContain('<p>Second paragraph</p>')
  })
})

describe('parseCommentBody', () => {
  it('parses both emojis and markdown together', () => {
    const input = 'Check out [Drupal](https://drupal.org) :heart:'
    const result = parseCommentBody(input)
    expect(result).toContain('<a href="https://drupal.org"')
    expect(result).toContain('❤️')
  })

  it('handles emoji in markdown links', () => {
    const input = '[Drupal Test Traits](https://www.drupal.org/project/dtt) :thinking: :nerd_face: :point_up:'
    const result = parseCommentBody(input)
    expect(result).toContain('<a href="https://www.drupal.org/project/dtt"')
    expect(result).toContain('🤔') // thinking
    expect(result).toContain('🤓') // nerd_face
    expect(result).toContain('☝') // point_up (base character)
  })

  it('handles inline code with emojis', () => {
    const input = '`ExistingSiteSelenium2DriverTest` is the same bag of hurt :scream:'
    const result = parseCommentBody(input)
    expect(result).toContain('<code>ExistingSiteSelenium2DriverTest</code>')
    expect(result).toContain('😱')
  })

  it('handles complex comment with multiple elements', () => {
    const input = 'Oh my, that comment for sure uncovered an important missing piece: No emojis in my blog comments! :scream: Edit: Now with emoji support! :racehorse:'
    const result = parseCommentBody(input)
    expect(result).toContain('😱') // scream
    expect(result).toContain('🐎') // racehorse
  })

  it('handles plain text without emojis or markdown', () => {
    const input = 'Nice solution to allow commenting!'
    const result = parseCommentBody(input)
    expect(result).toContain('Nice solution to allow commenting!')
  })

  it('processes emojis before markdown', () => {
    // This ensures emoji shortcodes don't get interpreted as markdown
    const input = ':heart: **love** :smile:'
    const result = parseCommentBody(input)
    expect(result).toContain('❤️')
    expect(result).toContain('<strong>love</strong>')
    expect(result).toContain('😄')
  })
})
