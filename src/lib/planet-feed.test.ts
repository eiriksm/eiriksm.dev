import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DrupalNode } from '@/types/drupal'

vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}))

function makeNode(overrides: Record<string, any> = {}): DrupalNode {
  return {
    id: overrides.id || 'uuid-1',
    type: 'node--article',
    drupal_internal__nid: overrides.nid || 1,
    title: overrides.title || 'Test Post',
    path: { alias: overrides.alias || '/test-post' },
    created: overrides.created || 1672531200,
    body: overrides.body || { value: '<p>Body content</p>', summary: '' },
    field_tags: overrides.field_tags || [],
    ...overrides,
  } as any
}

function makePlanetNode(overrides: Record<string, any> = {}): DrupalNode {
  return makeNode({
    field_tags: [{ name: 'Planet Drupal', drupal_internal__tid: 1 }],
    ...overrides,
  })
}

async function setup() {
  const fs = await import('fs')
  const mockMkdir = vi.mocked(fs.promises.mkdir)
  const mockWriteFile = vi.mocked(fs.promises.writeFile)
  const { generatePlanetFeed } = await import('./planet-feed')
  return { generatePlanetFeed, mockMkdir, mockWriteFile }
}

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe('generatePlanetFeed', () => {
  it('writes feed files to both target paths', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    const node = makePlanetNode()
    await generatePlanetFeed([node])

    expect(mockWriteFile).toHaveBeenCalledTimes(2)
    const rawPaths = mockWriteFile.mock.calls.map((call) => call[0])
    const normalizedPaths = rawPaths.map((p) => String(p).replace(/\\/g, '/'))
    expect(new Set(normalizedPaths).size).toBeGreaterThanOrEqual(2)
    expect(normalizedPaths.some((p) => p.includes('public/planet'))).toBe(true)
    expect(normalizedPaths.some((p) => p.includes('planet.xml'))).toBe(true)
  })

  it('creates parent directories recursively', async () => {
    const { generatePlanetFeed, mockMkdir } = await setup()
    await generatePlanetFeed([makePlanetNode()])

    expect(mockMkdir).toHaveBeenCalledTimes(2)
    for (const call of mockMkdir.mock.calls) {
      expect(call[1]).toEqual({ recursive: true })
    }
  })

  it('filters out nodes without planet drupal tag', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    const planetNode = makePlanetNode({ title: 'Planet Post' })
    const regularNode = makeNode({ title: 'Regular Post', field_tags: [{ name: 'JavaScript' }] })

    await generatePlanetFeed([planetNode, regularNode])

    const feedContent = String(mockWriteFile.mock.calls[0][1])
    expect(feedContent).toContain('Planet Post')
    expect(feedContent).not.toContain('Regular Post')
  })

  it('generates valid RSS XML structure with content namespace', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    await generatePlanetFeed([makePlanetNode({ title: 'My Planet Post' })])

    const feed = String(mockWriteFile.mock.calls[0][1])
    expect(feed).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(feed).toContain('xmlns:content="http://purl.org/rss/1.0/modules/content/"')
    expect(feed).toContain('<channel>')
    expect(feed).toContain('</channel>')
    expect(feed).toContain('</rss>')
    expect(feed).toContain('<item>')
    expect(feed).toContain('</item>')
  })

  it('includes feed title and description', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    await generatePlanetFeed([makePlanetNode()])

    const feed = String(mockWriteFile.mock.calls[0][1])
    expect(feed).toContain('eiriksm.dev Planet Drupal feed')
    expect(feed).toContain('Posts tagged &quot;planet drupal&quot; from eiriksm.dev')
  })

  it('includes node title and link without trailing slash', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    await generatePlanetFeed([makePlanetNode({ title: 'Cool Article', alias: '/cool-article' })])

    const feed = String(mockWriteFile.mock.calls[0][1])
    expect(feed).toContain('<title>Cool Article</title>')
    expect(feed).toContain('<link>https://eiriksm.dev/cool-article</link>')
    expect(feed).not.toContain('/cool-article/</link>')
  })

  it('uses content:encoded with full body HTML', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    const node = makePlanetNode({
      body: { value: '<p>Full <strong>body</strong> content</p>', summary: 'Short summary' },
    })
    await generatePlanetFeed([node])

    const feed = String(mockWriteFile.mock.calls[0][1])
    expect(feed).toContain('<content:encoded><![CDATA[<p>Full <strong>body</strong> content</p>]]></content:encoded>')
    expect(feed).not.toContain('<description><![CDATA[')
  })

  it('escapes XML special characters in titles', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    await generatePlanetFeed([makePlanetNode({ title: 'Using <script> & "quotes"' })])

    const feed = String(mockWriteFile.mock.calls[0][1])
    expect(feed).toContain('&lt;script&gt;')
    expect(feed).toContain('&amp;')
    expect(feed).toContain('&quot;quotes&quot;')
  })

  it('includes category elements for tags', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    const node = makePlanetNode({
      field_tags: [
        { name: 'Planet Drupal', drupal_internal__tid: 1 },
        { name: 'PHP' },
        { name: 'Open Source' },
      ],
    })
    await generatePlanetFeed([node])

    const feed = String(mockWriteFile.mock.calls[0][1])
    expect(feed).toContain('<category>Planet Drupal</category>')
    expect(feed).toContain('<category>PHP</category>')
    expect(feed).toContain('<category>Open Source</category>')
  })

  it('sorts planet nodes by created date descending (newest first)', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    const older = makePlanetNode({ title: 'Older Post', created: 1672531200 })
    const newer = makePlanetNode({ title: 'Newer Post', created: 1700000000 })

    await generatePlanetFeed([older, newer])

    const feed = String(mockWriteFile.mock.calls[0][1])
    const newerIdx = feed.indexOf('Newer Post')
    const olderIdx = feed.indexOf('Older Post')
    expect(newerIdx).toBeLessThan(olderIdx)
  })

  it('handles nodes with string created dates', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    const node = makePlanetNode({ title: 'String Date', created: '2023-06-15T12:00:00Z' })
    await generatePlanetFeed([node])

    const feed = String(mockWriteFile.mock.calls[0][1])
    expect(feed).toContain('String Date')
  })

  it('recognizes planet-drupal (hyphenated) tag variant', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    const node = makeNode({
      title: 'Hyphenated Tag',
      field_tags: [{ name: 'planet-drupal' }],
    })
    await generatePlanetFeed([node])

    const feed = String(mockWriteFile.mock.calls[0][1])
    expect(feed).toContain('Hyphenated Tag')
  })

  it('recognizes planet drupal tag by tid=1', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    const node = makeNode({
      title: 'TID Match',
      field_tags: [{ name: 'Something Else', drupal_internal__tid: 1 }],
    })
    await generatePlanetFeed([node])

    const feed = String(mockWriteFile.mock.calls[0][1])
    expect(feed).toContain('TID Match')
  })

  it('generates empty feed when no nodes have planet tag', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    const node = makeNode({ field_tags: [{ name: 'JavaScript' }] })
    await generatePlanetFeed([node])

    const feed = String(mockWriteFile.mock.calls[0][1])
    expect(feed).toContain('<channel>')
    expect(feed).not.toContain('<item>')
  })

  it('generates empty feed when given empty array', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    await generatePlanetFeed([])

    const feed = String(mockWriteFile.mock.calls[0][1])
    expect(feed).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(feed).not.toContain('<item>')
  })

  it('includes guid with isPermaLink attribute', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    await generatePlanetFeed([makePlanetNode({ alias: '/my-post' })])

    const feed = String(mockWriteFile.mock.calls[0][1])
    expect(feed).toMatch(/<guid isPermaLink="true">.*\/my-post<\/guid>/)
  })

  it('includes pubDate element', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    await generatePlanetFeed([makePlanetNode({ created: 1672531200 })])

    const feed = String(mockWriteFile.mock.calls[0][1])
    expect(feed).toContain('<pubDate>')
    expect(feed).toContain('</pubDate>')
  })

  it('uses "Untitled post" for nodes without title', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    await generatePlanetFeed([makePlanetNode({ title: '' })])

    const feed = String(mockWriteFile.mock.calls[0][1])
    expect(feed).toContain('Untitled post')
  })

  it('includes language element as en-US', async () => {
    const { generatePlanetFeed, mockWriteFile } = await setup()
    await generatePlanetFeed([makePlanetNode()])

    const feed = String(mockWriteFile.mock.calls[0][1])
    expect(feed).toContain('<language>en-US</language>')
  })
})
