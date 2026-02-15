import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { PUBLIC_DRUPAL_BASE_URL: 'https://example.com' } } })

// Mock fs promises
const mockReadFile = vi.fn()
const mockWriteFile = vi.fn()
const mockMkdir = vi.fn()
vi.mock('fs', () => ({
  promises: {
    readFile: (...args: any[]) => mockReadFile(...args),
    writeFile: (...args: any[]) => mockWriteFile(...args),
    mkdir: (...args: any[]) => mockMkdir(...args),
  },
}))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  mockFetch.mockReset()
  mockReadFile.mockReset()
  mockWriteFile.mockReset()
  mockMkdir.mockReset()
  mockMkdir.mockResolvedValue(undefined)
  mockWriteFile.mockResolvedValue(undefined)
})

async function loadModule() {
  const mod = await import('./drupal')
  return mod
}

describe('normalizePath', () => {
  it('returns empty string for undefined', async () => {
    const { normalizePath } = await loadModule()
    expect(normalizePath(undefined)).toBe('')
  })

  it('returns empty string for empty string', async () => {
    const { normalizePath } = await loadModule()
    expect(normalizePath('')).toBe('')
  })

  it('returns empty string for whitespace-only string', async () => {
    const { normalizePath } = await loadModule()
    expect(normalizePath('   ')).toBe('')
  })

  it('ensures leading slash on a plain path', async () => {
    const { normalizePath } = await loadModule()
    expect(normalizePath('my-article')).toBe('/my-article')
  })

  it('preserves leading slash', async () => {
    const { normalizePath } = await loadModule()
    expect(normalizePath('/my-article')).toBe('/my-article')
  })

  it('strips trailing slash', async () => {
    const { normalizePath } = await loadModule()
    expect(normalizePath('/my-article/')).toBe('/my-article')
  })

  it('extracts pathname from full http URL', async () => {
    const { normalizePath } = await loadModule()
    expect(normalizePath('https://eiriksm.dev/my-article')).toBe('/my-article')
  })

  it('extracts pathname from http:// URL', async () => {
    const { normalizePath } = await loadModule()
    expect(normalizePath('http://example.com/blog/post')).toBe('/blog/post')
  })

  it('extracts pathname from domain-like string with dots and slashes', async () => {
    const { normalizePath } = await loadModule()
    expect(normalizePath('eiriksm.dev/some-path')).toBe('/some-path')
  })

  it('strips trailing slash from extracted URL pathname', async () => {
    const { normalizePath } = await loadModule()
    expect(normalizePath('https://eiriksm.dev/my-article/')).toBe('/my-article')
  })

  it('handles URL with only root path', async () => {
    const { normalizePath } = await loadModule()
    expect(normalizePath('https://eiriksm.dev/')).toBe('')
  })

  it('handles nested paths', async () => {
    const { normalizePath } = await loadModule()
    expect(normalizePath('/node/123')).toBe('/node/123')
  })

  it('trims whitespace before processing', async () => {
    const { normalizePath } = await loadModule()
    expect(normalizePath('  /my-article  ')).toBe('/my-article')
  })

  it('returns trimmed path unchanged when no URL parsing is needed', async () => {
    const { normalizePath } = await loadModule()
    expect(normalizePath('/just-a-path')).toBe('/just-a-path')
  })
})

describe('getAllResources', () => {
  // Helper to wrap flat objects in JSON:API resource format
  function toJsonApi(obj: any) {
    const { id, type, ...attributes } = obj
    return { id, type: type || 'node--article', attributes }
  }

  function mockFetchResponse(data: any[]) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: data.map(toJsonApi) }),
    })
  }

  function mockEmptyResponse() {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })
  }

  it('returns empty array when first page returns nothing', async () => {
    mockFetch.mockImplementation(() => mockEmptyResponse())
    const { getAllResources } = await loadModule()

    const result = await getAllResources('node--article')
    expect(result).toEqual([])
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('returns resources from a single page', async () => {
    const resources = [
      { id: '1', title: 'Article 1' },
      { id: '2', title: 'Article 2' },
    ]
    mockFetch
      .mockImplementationOnce(() => mockFetchResponse(resources))
      .mockImplementationOnce(() => mockEmptyResponse())

    const { getAllResources } = await loadModule()
    const result = await getAllResources<any>('node--article')

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('1')
    expect(result[0].title).toBe('Article 1')
  })

  it('pages through multiple result sets', async () => {
    const page1 = [
      { id: '1', title: 'A' },
      { id: '2', title: 'B' },
    ]
    const page2 = [{ id: '3', title: 'C' }]
    mockFetch
      .mockImplementationOnce(() => mockFetchResponse(page1))
      .mockImplementationOnce(() => mockFetchResponse(page2))
      .mockImplementationOnce(() => mockEmptyResponse())

    const { getAllResources } = await loadModule()
    const result = await getAllResources('node--article')

    expect(result).toHaveLength(3)
    expect(result.map((r: any) => r.id)).toEqual(['1', '2', '3'])
  })

  it('deduplicates resources by id', async () => {
    const page1 = [{ id: '1', title: 'A' }]
    const page2 = [{ id: '1', title: 'A duplicate' }]
    mockFetch
      .mockImplementationOnce(() => mockFetchResponse(page1))
      .mockImplementationOnce(() => mockFetchResponse(page2))

    const { getAllResources } = await loadModule()
    const result = await getAllResources<any>('node--article')

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('stops when all returned resources are duplicates', async () => {
    const page1 = [{ id: '1' }, { id: '2' }]
    const page2 = [{ id: '1' }, { id: '2' }]
    mockFetch
      .mockImplementationOnce(() => mockFetchResponse(page1))
      .mockImplementationOnce(() => mockFetchResponse(page2))

    const { getAllResources } = await loadModule()
    const result = await getAllResources('node--article')

    expect(result).toHaveLength(2)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('handles resources without id field', async () => {
    const resources = [{ title: 'No ID' }]
    mockFetch
      .mockImplementationOnce(() => mockFetchResponse(resources))
      .mockImplementationOnce(() => mockEmptyResponse())

    const { getAllResources } = await loadModule()
    const result = await getAllResources<any>('node--article')

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('No ID')
  })
})

describe('ensurePathUuidMap', () => {
  it('returns cached map from disk when it exists', async () => {
    const diskMap = { '/my-article': 'uuid-1', '/node/42': 'uuid-2' }
    mockReadFile.mockResolvedValueOnce(JSON.stringify(diskMap))

    const { ensurePathUuidMap } = await loadModule()
    const result = await ensurePathUuidMap()

    expect(result).toEqual(diskMap)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('builds map from provided nodes when disk cache is empty', async () => {
    mockReadFile.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

    const nodes = [
      {
        id: 'uuid-1',
        path: { alias: '/my-article' },
        drupal_internal__nid: 42,
      },
    ]

    const { ensurePathUuidMap } = await loadModule()
    const result = await ensurePathUuidMap(nodes as any)

    expect(result['/my-article']).toBe('uuid-1')
    expect(result['/node/42']).toBe('uuid-1')
    expect(mockWriteFile).toHaveBeenCalled()
  })

  it('fetches resources when no nodes provided and disk cache is empty', async () => {
    mockReadFile.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

    const fetchedNodes = [
      {
        id: 'uuid-fetched',
        type: 'node--article',
        attributes: {
          path: { alias: '/fetched-article' },
          drupal_internal__nid: 99,
        },
      },
    ]
    mockFetch
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ data: fetchedNodes }) }))
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) }))

    const { ensurePathUuidMap } = await loadModule()
    const result = await ensurePathUuidMap()

    expect(result['/fetched-article']).toBe('uuid-fetched')
    expect(mockFetch).toHaveBeenCalled()
  })

  it('warns on non-ENOENT read errors', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockReadFile.mockRejectedValueOnce(Object.assign(new Error('Permission denied'), { code: 'EACCES' }))

    const nodes = [
      { id: 'uuid-1', path: { alias: '/test' }, drupal_internal__nid: 1 },
    ]

    const { ensurePathUuidMap } = await loadModule()
    await ensurePathUuidMap(nodes as any)

    expect(consoleSpy).toHaveBeenCalledWith(
      '[drupal] Failed to read path UUID map:',
      expect.any(Error)
    )
    consoleSpy.mockRestore()
  })
})

describe('addNodesToPathUuidMap', () => {
  it('merges new nodes into existing cached map', async () => {
    const existingMap = { '/old-article': 'uuid-old' }
    mockReadFile.mockResolvedValueOnce(JSON.stringify(existingMap))

    const { ensurePathUuidMap, addNodesToPathUuidMap } = await loadModule()
    await ensurePathUuidMap()

    const newNodes = [
      {
        id: 'uuid-new',
        path: { alias: '/new-article' },
        drupal_internal__nid: 100,
      },
    ]

    await addNodesToPathUuidMap(newNodes as any)

    const writeCall = mockWriteFile.mock.calls[0]
    const writtenMap = JSON.parse(writeCall[1])
    expect(writtenMap['/old-article']).toBe('uuid-old')
    expect(writtenMap['/new-article']).toBe('uuid-new')
    expect(writtenMap['/node/100']).toBe('uuid-new')
  })

  it('handles persist failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockReadFile.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

    const { ensurePathUuidMap, addNodesToPathUuidMap } = await loadModule()
    await ensurePathUuidMap([] as any)

    mockMkdir.mockRejectedValueOnce(new Error('disk full'))

    const nodes = [
      { id: 'uuid-1', path: { alias: '/test' }, drupal_internal__nid: 1 },
    ]

    await addNodesToPathUuidMap(nodes as any)

    expect(consoleSpy).toHaveBeenCalledWith(
      '[drupal] Failed to persist path UUID map:',
      expect.any(Error)
    )
    consoleSpy.mockRestore()
  })

  it('creates nodes with both alias and nid paths', async () => {
    mockReadFile.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

    const { ensurePathUuidMap, addNodesToPathUuidMap } = await loadModule()
    await ensurePathUuidMap([] as any)

    const nodes = [
      {
        id: 'uuid-abc',
        path: { alias: '/nice-slug' },
        drupal_internal__nid: 55,
      },
    ]

    await addNodesToPathUuidMap(nodes as any)

    const writeCall = mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1]
    const writtenMap = JSON.parse(writeCall[1])
    expect(writtenMap['/nice-slug']).toBe('uuid-abc')
    expect(writtenMap['/node/55']).toBe('uuid-abc')
  })
})

describe('ensureTagUuidMap', () => {
  it('returns cached map from disk when it exists', async () => {
    const tagMap = { '5': 'tag-uuid-5', '12': 'tag-uuid-12' }
    mockReadFile.mockResolvedValueOnce(JSON.stringify(tagMap))

    const { ensureTagUuidMap } = await loadModule()
    const result = await ensureTagUuidMap()

    expect(result).toEqual(tagMap)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('builds map from provided tags when disk cache is empty', async () => {
    mockReadFile.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

    const tags = [
      { id: 'tag-uuid-1', drupal_internal__tid: 10 },
      { id: 'tag-uuid-2', tid: 20 },
    ]

    const { ensureTagUuidMap } = await loadModule()
    const result = await ensureTagUuidMap(tags)

    expect(result['10']).toBe('tag-uuid-1')
    expect(result['20']).toBe('tag-uuid-2')
    expect(mockWriteFile).toHaveBeenCalled()
  })

  it('fetches tags when none provided and disk is empty', async () => {
    mockReadFile.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

    const fetchedTags = [
      {
        id: 'tag-uuid-fetched',
        type: 'taxonomy_term--tags',
        attributes: { drupal_internal__tid: 30 },
      },
    ]
    mockFetch
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ data: fetchedTags }) }))
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) }))

    const { ensureTagUuidMap } = await loadModule()
    const result = await ensureTagUuidMap()

    expect(result['30']).toBe('tag-uuid-fetched')
    expect(mockFetch).toHaveBeenCalled()
  })

  it('skips tags without id', async () => {
    mockReadFile.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

    const tags = [
      { id: 'tag-uuid-1', drupal_internal__tid: 10 },
      { drupal_internal__tid: 20 },
      { id: 'tag-uuid-3' },
    ]

    const { ensureTagUuidMap } = await loadModule()
    const result = await ensureTagUuidMap(tags)

    expect(result['10']).toBe('tag-uuid-1')
    expect(result['20']).toBeUndefined()
    expect(Object.keys(result)).toHaveLength(1)
  })

  it('prefers drupal_internal__tid over tid', async () => {
    mockReadFile.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

    const tags = [{ id: 'tag-uuid-1', drupal_internal__tid: 10, tid: 99 }]

    const { ensureTagUuidMap } = await loadModule()
    const result = await ensureTagUuidMap(tags)

    expect(result['10']).toBe('tag-uuid-1')
    expect(result['99']).toBeUndefined()
  })
})
