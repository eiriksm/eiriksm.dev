import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next-drupal before any imports
const mockGetResourceCollection = vi.fn()
vi.mock('next-drupal', () => {
  function MockDrupalClient() {
    // @ts-expect-error mock constructor
    this.getResourceCollection = mockGetResourceCollection
  }
  return { DrupalClient: MockDrupalClient, DrupalNode: {} }
})

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
  mockGetResourceCollection.mockReset()
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
  it('returns empty array when first page returns nothing', async () => {
    mockGetResourceCollection.mockResolvedValueOnce([])
    const { getAllResources } = await loadModule()

    const result = await getAllResources('node--article')
    expect(result).toEqual([])
    expect(mockGetResourceCollection).toHaveBeenCalledTimes(1)
  })

  it('returns resources from a single page', async () => {
    const resources = [
      { id: '1', title: 'Article 1' },
      { id: '2', title: 'Article 2' },
    ]
    mockGetResourceCollection.mockResolvedValueOnce(resources)
    mockGetResourceCollection.mockResolvedValueOnce([])

    const { getAllResources } = await loadModule()
    const result = await getAllResources('node--article')

    expect(result).toEqual(resources)
  })

  it('pages through multiple result sets', async () => {
    const page1 = [
      { id: '1', title: 'A' },
      { id: '2', title: 'B' },
    ]
    const page2 = [{ id: '3', title: 'C' }]
    mockGetResourceCollection
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2)
      .mockResolvedValueOnce([])

    const { getAllResources } = await loadModule()
    const result = await getAllResources('node--article')

    expect(result).toHaveLength(3)
    expect(result.map((r: any) => r.id)).toEqual(['1', '2', '3'])
  })

  it('deduplicates resources by id', async () => {
    const page1 = [{ id: '1', title: 'A' }]
    const page2 = [{ id: '1', title: 'A duplicate' }]
    mockGetResourceCollection
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2)

    const { getAllResources } = await loadModule()
    const result = await getAllResources('node--article')

    // Second page returns a duplicate, added count is 0, so loop breaks
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ id: '1', title: 'A' })
  })

  it('stops when all returned resources are duplicates', async () => {
    const page1 = [{ id: '1' }, { id: '2' }]
    const page2 = [{ id: '1' }, { id: '2' }]
    mockGetResourceCollection
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2)

    const { getAllResources } = await loadModule()
    const result = await getAllResources('node--article')

    expect(result).toHaveLength(2)
    // Should not make a third call since all page2 items were duplicates
    expect(mockGetResourceCollection).toHaveBeenCalledTimes(2)
  })

  it('passes page limit and offset in params', async () => {
    mockGetResourceCollection.mockResolvedValueOnce([])

    const { getAllResources } = await loadModule()
    await getAllResources('node--article', undefined, 10)

    expect(mockGetResourceCollection).toHaveBeenCalledWith('node--article', {
      params: {
        'page[limit]': 10,
        'page[offset]': 0,
      },
    })
  })

  it('increments offset by the number of resources returned', async () => {
    const page1 = [{ id: '1' }, { id: '2' }, { id: '3' }]
    mockGetResourceCollection
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce([])

    const { getAllResources } = await loadModule()
    await getAllResources('node--article', undefined, 5)

    // Second call should have offset = 3 (length of page1)
    expect(mockGetResourceCollection).toHaveBeenCalledTimes(2)
    expect(mockGetResourceCollection.mock.calls[1][1]).toEqual({
      params: {
        'page[limit]': 5,
        'page[offset]': 3,
      },
    })
  })

  it('handles resources without id field', async () => {
    const resources = [{ title: 'No ID' }]
    mockGetResourceCollection
      .mockResolvedValueOnce(resources)
      .mockResolvedValueOnce([])

    const { getAllResources } = await loadModule()
    const result = await getAllResources('node--article')

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ title: 'No ID' })
  })

  it('uses query object from DrupalJsonApiParams when provided', async () => {
    mockGetResourceCollection.mockResolvedValueOnce([])

    const mockParamsBuilder = {
      getQueryObject: () => ({ 'filter[status]': '1', include: 'field_tags' }),
    }

    const { getAllResources } = await loadModule()
    await getAllResources('node--article', mockParamsBuilder as any)

    expect(mockGetResourceCollection).toHaveBeenCalledWith('node--article', {
      params: {
        'filter[status]': '1',
        include: 'field_tags',
        'page[limit]': 50,
        'page[offset]': 0,
      },
    })
  })
})

describe('ensurePathUuidMap', () => {
  it('returns cached map from disk when it exists', async () => {
    const diskMap = { '/my-article': 'uuid-1', '/node/42': 'uuid-2' }
    mockReadFile.mockResolvedValueOnce(JSON.stringify(diskMap))

    const { ensurePathUuidMap } = await loadModule()
    const result = await ensurePathUuidMap()

    expect(result).toEqual(diskMap)
    expect(mockGetResourceCollection).not.toHaveBeenCalled()
  })

  it('builds map from provided nodes when disk cache is empty', async () => {
    // Disk returns empty
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
        path: { alias: '/fetched-article' },
        drupal_internal__nid: 99,
      },
    ]
    mockGetResourceCollection.mockResolvedValueOnce(fetchedNodes)
    mockGetResourceCollection.mockResolvedValueOnce([])

    const { ensurePathUuidMap } = await loadModule()
    const result = await ensurePathUuidMap()

    expect(result['/fetched-article']).toBe('uuid-fetched')
    expect(mockGetResourceCollection).toHaveBeenCalled()
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
    // First load an existing map to populate the cache
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

    // writeFile should be called with the merged map
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
    // Initialize with empty to set cache
    await ensurePathUuidMap([] as any)

    const nodes = [
      {
        id: 'uuid-abc',
        path: { alias: '/nice-slug' },
        drupal_internal__nid: 55,
      },
    ]

    await addNodesToPathUuidMap(nodes as any)

    // The last writeFile call is from addNodesToPathUuidMap (the first is from ensurePathUuidMap)
    const writeCall = mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1]
    const writtenMap = JSON.parse(writeCall[1])
    expect(writtenMap['/nice-slug']).toBe('uuid-abc')
    expect(writtenMap['/node/55']).toBe('uuid-abc')
  })
})

describe('ensureTagUuidMap', () => {
  it('returns cached map from disk when it exists', async () => {
    // First call for path map (module init side effect doesn't trigger, but ensureTagUuidMap reads tag map)
    const tagMap = { '5': 'tag-uuid-5', '12': 'tag-uuid-12' }
    mockReadFile.mockResolvedValueOnce(JSON.stringify(tagMap))

    const { ensureTagUuidMap } = await loadModule()
    const result = await ensureTagUuidMap()

    expect(result).toEqual(tagMap)
    expect(mockGetResourceCollection).not.toHaveBeenCalled()
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

    const fetchedTags = [{ id: 'tag-uuid-fetched', drupal_internal__tid: 30 }]
    mockGetResourceCollection.mockResolvedValueOnce(fetchedTags)
    mockGetResourceCollection.mockResolvedValueOnce([])

    const { ensureTagUuidMap } = await loadModule()
    const result = await ensureTagUuidMap()

    expect(result['30']).toBe('tag-uuid-fetched')
    expect(mockGetResourceCollection).toHaveBeenCalled()
  })

  it('skips tags without id', async () => {
    mockReadFile.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

    const tags = [
      { id: 'tag-uuid-1', drupal_internal__tid: 10 },
      { drupal_internal__tid: 20 }, // no id
      { id: 'tag-uuid-3' }, // no tid
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
