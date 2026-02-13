import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatDate, absoluteUrl, getNodePath, extractExcerpt } from './utils'

describe('formatDate', () => {
  it('formats a Unix timestamp (seconds) correctly', () => {
    // 1672531200 = 2023-01-01T00:00:00Z
    const result = formatDate(1672531200)
    expect(result).toBe('January 1, 2023')
  })

  it('formats a date string correctly', () => {
    const result = formatDate('2023-06-15T12:00:00Z')
    expect(result).toContain('June')
    expect(result).toContain('15')
    expect(result).toContain('2023')
  })

  it('formats another Unix timestamp', () => {
    // 1700000000 = 2023-11-14T22:13:20Z
    const result = formatDate(1700000000)
    expect(result).toContain('November')
    expect(result).toContain('2023')
  })
})

describe('absoluteUrl', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://eiriksm.dev')
  })

  it('prepends the site URL to a path', () => {
    expect(absoluteUrl('/my-article')).toBe('https://eiriksm.dev/my-article')
  })

  it('handles root path', () => {
    expect(absoluteUrl('/')).toBe('https://eiriksm.dev/')
  })

  it('handles empty string', () => {
    expect(absoluteUrl('')).toBe('https://eiriksm.dev')
  })
})

describe('getNodePath', () => {
  function makeNode(overrides: Record<string, any> = {}) {
    return {
      drupal_internal__nid: 42,
      path: { alias: '/my-article' },
      ...overrides,
    } as any
  }

  it('returns alias path with trailing slash', () => {
    const node = makeNode()
    expect(getNodePath(node)).toBe('/my-article/')
  })

  it('falls back to /node/{nid} when no alias', () => {
    const node = makeNode({ path: {} })
    expect(getNodePath(node)).toBe('/node/42/')
  })

  it('falls back to /node/{nid} when path is null', () => {
    const node = makeNode({ path: null })
    expect(getNodePath(node)).toBe('/node/42/')
  })

  it('strips full http URL to pathname', () => {
    const node = makeNode({ path: { alias: 'http://example.com/blog/post' } })
    expect(getNodePath(node)).toBe('/blog/post/')
  })

  it('strips full https URL to pathname', () => {
    const node = makeNode({ path: { alias: 'https://example.com/blog/post' } })
    expect(getNodePath(node)).toBe('/blog/post/')
  })

  it('strips domain-like paths (with dot and slash)', () => {
    const node = makeNode({ path: { alias: 'example.com/blog/post' } })
    expect(getNodePath(node)).toBe('/blog/post/')
  })

  it('prepends slash if missing', () => {
    const node = makeNode({ path: { alias: 'no-leading-slash' } })
    expect(getNodePath(node)).toBe('/no-leading-slash/')
  })

  it('falls back to /node/{nid} when alias resolves to root', () => {
    const node = makeNode({ path: { alias: 'https://example.com/' } })
    expect(getNodePath(node)).toBe('/node/42/')
  })

  it('preserves trailing slash if already present', () => {
    const node = makeNode({ path: { alias: '/already-has-slash/' } })
    expect(getNodePath(node)).toBe('/already-has-slash/')
  })

  it('trims whitespace from path', () => {
    const node = makeNode({ path: { alias: '  /spaced  ' } })
    expect(getNodePath(node)).toBe('/spaced/')
  })
})

describe('extractExcerpt', () => {
  it('strips HTML tags', () => {
    const result = extractExcerpt('<p>Hello <strong>world</strong></p>')
    expect(result).toBe('Hello world')
  })

  it('truncates long text to default 200 chars', () => {
    const longText = 'a'.repeat(250)
    const result = extractExcerpt(longText)
    expect(result.length).toBeLessThanOrEqual(203) // 200 + "..."
    expect(result).toMatch(/\.\.\.$/);
  })

  it('does not truncate short text', () => {
    const result = extractExcerpt('Short text')
    expect(result).toBe('Short text')
  })

  it('respects custom maxLength', () => {
    const text = 'This is a sentence that is definitely longer than ten characters'
    const result = extractExcerpt(text, 10)
    expect(result.length).toBeLessThanOrEqual(13) // 10 + "..."
    expect(result).toMatch(/\.\.\.$/);
  })

  it('replaces &nbsp; with regular spaces', () => {
    const result = extractExcerpt('Hello&nbsp;world')
    expect(result).toBe('Hello world')
  })

  it('replaces unicode non-breaking spaces', () => {
    const result = extractExcerpt('Hello\u00a0world')
    expect(result).toBe('Hello world')
  })

  it('collapses multiple whitespace characters', () => {
    const result = extractExcerpt('Hello    world   foo')
    expect(result).toBe('Hello world foo')
  })

  it('handles empty string', () => {
    const result = extractExcerpt('')
    expect(result).toBe('')
  })

  it('handles string with only HTML tags', () => {
    const result = extractExcerpt('<br/><hr/><div></div>')
    expect(result).toBe('')
  })

  it('handles complex HTML content', () => {
    const html = '<div><p>First paragraph.</p><p>Second&nbsp;paragraph.</p></div>'
    const result = extractExcerpt(html)
    expect(result).toBe('First paragraph. Second paragraph.')
  })
})
