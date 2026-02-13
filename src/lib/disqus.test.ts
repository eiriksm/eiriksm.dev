import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}))

function makeDisqusXml({
  threads,
  posts,
}: {
  threads: { id: string; link?: string; threadId?: string }[]
  posts: {
    id: string
    threadRef: string
    message?: string
    createdAt?: string
    authorName?: string
    authorUsername?: string
    isAnonymous?: boolean
    isDeleted?: boolean
    isSpam?: boolean
  }[]
}): string {
  const threadXml = threads
    .map((t) => {
      const idAttr = t.threadId ? `<id>${t.threadId}</id>` : ''
      const link = t.link ? `<link>${t.link}</link>` : ''
      return `<thread dsq:id="${t.id}">${idAttr}${link}</thread>`
    })
    .join('\n')

  const postXml = posts
    .map((p) => {
      const authorBlock = `<author><name>${p.authorName || 'TestUser'}</name><username>${p.authorUsername || 'testuser'}</username><isAnonymous>${p.isAnonymous ?? false}</isAnonymous></author>`
      return `<post dsq:id="${p.id}">
        <thread dsq:id="${p.threadRef}" />
        <message>${p.message || 'Test comment'}</message>
        <createdAt>${p.createdAt || '2023-01-15T10:30:00Z'}</createdAt>
        ${authorBlock}
        <isDeleted>${p.isDeleted ?? false}</isDeleted>
        <isSpam>${p.isSpam ?? false}</isSpam>
      </post>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="utf-8"?>
<disqus xmlns:dsq="http://disqus.com/disqus-internals">
  ${threadXml}
  ${postXml}
</disqus>`
}

async function setupMocks(config: {
  disqusXml?: string | false
  pathUuidMap?: string | false | Error
} = {}) {
  const { disqusXml = false, pathUuidMap = false } = config

  const { existsSync, readFileSync } = await import('fs')
  const mockExists = vi.mocked(existsSync)
  const mockRead = vi.mocked(readFileSync)

  mockExists.mockImplementation((p) => {
    if (typeof p === 'string' && p.endsWith('disqus.xml')) return disqusXml !== false
    if (typeof p === 'string' && p.endsWith('path-uuid-map.json')) return pathUuidMap !== false
    return false
  })

  mockRead.mockImplementation((p) => {
    if (typeof p === 'string' && p.endsWith('disqus.xml') && typeof disqusXml === 'string') return disqusXml
    if (typeof p === 'string' && p.endsWith('path-uuid-map.json')) {
      if (pathUuidMap instanceof Error) throw pathUuidMap
      if (typeof pathUuidMap === 'string') return pathUuidMap
    }
    return ''
  })

  const mod = await import('./disqus')
  return { ...mod, mockExists, mockRead }
}

beforeEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()

  vi.mock('fs', () => ({
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
  }))
})

describe('getDisqusCommentCount', () => {
  it('returns 0 when disqus.xml does not exist', async () => {
    const { getDisqusCommentCount } = await setupMocks()
    expect(getDisqusCommentCount('/some-article')).toBe(0)
  })

  it('returns 0 when XML has no disqus root element', async () => {
    const { getDisqusCommentCount } = await setupMocks({ disqusXml: '<root></root>' })
    expect(getDisqusCommentCount('/some-article')).toBe(0)
  })

  it('returns correct count for a path with comments', async () => {
    const xml = makeDisqusXml({
      threads: [{ id: 't1', link: 'https://eiriksm.dev/my-article' }],
      posts: [
        { id: 'p1', threadRef: 't1', message: 'Great post!' },
        { id: 'p2', threadRef: 't1', message: 'Thanks!' },
      ],
    })

    const { getDisqusCommentCount } = await setupMocks({ disqusXml: xml })
    expect(getDisqusCommentCount('/my-article')).toBe(2)
  })

  it('returns 0 for a path with no comments', async () => {
    const xml = makeDisqusXml({
      threads: [{ id: 't1', link: 'https://eiriksm.dev/my-article' }],
      posts: [{ id: 'p1', threadRef: 't1', message: 'Hello' }],
    })

    const { getDisqusCommentCount } = await setupMocks({ disqusXml: xml })
    expect(getDisqusCommentCount('/other-article')).toBe(0)
  })
})

describe('getDisqusComments', () => {
  it('returns empty array when disqus.xml does not exist', async () => {
    const { getDisqusComments } = await setupMocks()
    expect(getDisqusComments('/some-article')).toEqual([])
  })

  it('parses a single comment correctly', async () => {
    const xml = makeDisqusXml({
      threads: [{ id: 't1', link: 'https://eiriksm.dev/my-post' }],
      posts: [
        {
          id: 'p100',
          threadRef: 't1',
          message: 'Nice article!',
          createdAt: '2023-06-15T14:00:00Z',
          authorName: 'Alice',
          authorUsername: 'alice123',
        },
      ],
    })

    const { getDisqusComments } = await setupMocks({ disqusXml: xml })
    const comments = getDisqusComments('/my-post')

    expect(comments).toHaveLength(1)
    expect(comments[0]).toMatchObject({
      id: 'p100',
      author: 'Alice',
      body: 'Nice article!',
      createdAt: '2023-06-15T14:00:00Z',
      isAnonymous: false,
    })
  })

  it('skips deleted posts', async () => {
    const xml = makeDisqusXml({
      threads: [{ id: 't1', link: 'https://eiriksm.dev/article' }],
      posts: [
        { id: 'p1', threadRef: 't1', message: 'Visible' },
        { id: 'p2', threadRef: 't1', message: 'Deleted', isDeleted: true },
      ],
    })

    const { getDisqusComments } = await setupMocks({ disqusXml: xml })
    const comments = getDisqusComments('/article')

    expect(comments).toHaveLength(1)
    expect(comments[0].body).toBe('Visible')
  })

  it('skips spam posts', async () => {
    const xml = makeDisqusXml({
      threads: [{ id: 't1', link: 'https://eiriksm.dev/article' }],
      posts: [
        { id: 'p1', threadRef: 't1', message: 'Real comment' },
        { id: 'p2', threadRef: 't1', message: 'Buy cheap stuff', isSpam: true },
      ],
    })

    const { getDisqusComments } = await setupMocks({ disqusXml: xml })
    const comments = getDisqusComments('/article')

    expect(comments).toHaveLength(1)
    expect(comments[0].body).toBe('Real comment')
  })

  it('handles anonymous authors', async () => {
    const xml = makeDisqusXml({
      threads: [{ id: 't1', link: 'https://eiriksm.dev/post' }],
      posts: [
        {
          id: 'p1',
          threadRef: 't1',
          message: 'Anonymous comment',
          isAnonymous: true,
          authorName: 'Some Name',
        },
      ],
    })

    const { getDisqusComments } = await setupMocks({ disqusXml: xml })
    const comments = getDisqusComments('/post')

    expect(comments).toHaveLength(1)
    expect(comments[0].isAnonymous).toBe(true)
    expect(comments[0].author).toBe('Some Name')
  })

  it('sorts comments by date oldest first', async () => {
    const xml = makeDisqusXml({
      threads: [{ id: 't1', link: 'https://eiriksm.dev/sorted' }],
      posts: [
        { id: 'p1', threadRef: 't1', message: 'Third', createdAt: '2023-03-01T00:00:00Z' },
        { id: 'p2', threadRef: 't1', message: 'First', createdAt: '2023-01-01T00:00:00Z' },
        { id: 'p3', threadRef: 't1', message: 'Second', createdAt: '2023-02-01T00:00:00Z' },
      ],
    })

    const { getDisqusComments } = await setupMocks({ disqusXml: xml })
    const comments = getDisqusComments('/sorted')

    expect(comments).toHaveLength(3)
    expect(comments[0].body).toBe('First')
    expect(comments[1].body).toBe('Second')
    expect(comments[2].body).toBe('Third')
  })

  it('handles multiple threads with separate comment lists', async () => {
    const xml = makeDisqusXml({
      threads: [
        { id: 't1', link: 'https://eiriksm.dev/post-one' },
        { id: 't2', link: 'https://eiriksm.dev/post-two' },
      ],
      posts: [
        { id: 'p1', threadRef: 't1', message: 'Comment on post one' },
        { id: 'p2', threadRef: 't2', message: 'Comment on post two' },
        { id: 'p3', threadRef: 't1', message: 'Another on post one' },
      ],
    })

    const { getDisqusComments, getDisqusCommentCount } = await setupMocks({ disqusXml: xml })

    expect(getDisqusComments('/post-one')).toHaveLength(2)
    expect(getDisqusComments('/post-two')).toHaveLength(1)
    expect(getDisqusCommentCount('/post-one')).toBe(2)
    expect(getDisqusCommentCount('/post-two')).toBe(1)
  })

  it('matches path with trailing slash in lookup', async () => {
    const xml = makeDisqusXml({
      threads: [{ id: 't1', link: 'https://eiriksm.dev/my-article/' }],
      posts: [{ id: 'p1', threadRef: 't1', message: 'Hello' }],
    })

    const { getDisqusComments } = await setupMocks({ disqusXml: xml })
    expect(getDisqusComments('/my-article')).toHaveLength(1)
  })

  it('resolves thread via UUID from path-uuid-map when link has no valid path', async () => {
    const uuid = 'a1b2c3d4-e5f6-1234-89ab-abcdef012345'

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<disqus xmlns:dsq="http://disqus.com/disqus-internals">
  <thread dsq:id="t1"><id>${uuid}</id></thread>
  <post dsq:id="p1">
    <thread dsq:id="t1" />
    <message>UUID-resolved comment</message>
    <createdAt>2023-05-01T12:00:00Z</createdAt>
    <author><name>Bob</name><username>bob</username><isAnonymous>false</isAnonymous></author>
    <isDeleted>false</isDeleted>
    <isSpam>false</isSpam>
  </post>
</disqus>`

    const { getDisqusComments } = await setupMocks({
      disqusXml: xml,
      pathUuidMap: JSON.stringify({ '/uuid-article': uuid }),
    })
    const comments = getDisqusComments('/uuid-article')

    expect(comments).toHaveLength(1)
    expect(comments[0].body).toBe('UUID-resolved comment')
    expect(comments[0].author).toBe('Bob')
  })

  it('prefers non-/node/ path in uuid map when both exist', async () => {
    const uuid = 'f1e2d3c4-b5a6-1789-89ab-fedcba987654'

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<disqus xmlns:dsq="http://disqus.com/disqus-internals">
  <thread dsq:id="t1"><id>${uuid}</id></thread>
  <post dsq:id="p1">
    <thread dsq:id="t1" />
    <message>Comment here</message>
    <createdAt>2023-07-01T00:00:00Z</createdAt>
    <author><name>Charlie</name><username>charlie</username><isAnonymous>false</isAnonymous></author>
    <isDeleted>false</isDeleted>
    <isSpam>false</isSpam>
  </post>
</disqus>`

    const { getDisqusComments } = await setupMocks({
      disqusXml: xml,
      pathUuidMap: JSON.stringify({ '/node/42': uuid, '/nice-slug': uuid }),
    })

    expect(getDisqusComments('/nice-slug')).toHaveLength(1)
    expect(getDisqusComments('/node/42')).toEqual([])
  })

  it('handles malformed XML gracefully', async () => {
    const { getDisqusComments, getDisqusCommentCount } = await setupMocks({
      disqusXml: '<<<not valid xml',
    })

    expect(getDisqusComments('/any')).toEqual([])
    expect(getDisqusCommentCount('/any')).toBe(0)
  })

  it('handles a single thread (non-array) in XML', async () => {
    const xml = makeDisqusXml({
      threads: [{ id: 't1', link: 'https://eiriksm.dev/solo' }],
      posts: [{ id: 'p1', threadRef: 't1', message: 'Only comment' }],
    })

    const { getDisqusComments } = await setupMocks({ disqusXml: xml })
    expect(getDisqusComments('/solo')).toHaveLength(1)
  })

  it('uses username as fallback when author name is missing for non-anonymous user', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<disqus xmlns:dsq="http://disqus.com/disqus-internals">
  <thread dsq:id="t1"><link>https://eiriksm.dev/fallback-test</link></thread>
  <post dsq:id="p1">
    <thread dsq:id="t1" />
    <message>No name author</message>
    <createdAt>2023-08-01T00:00:00Z</createdAt>
    <author><username>fallback_user</username><isAnonymous>false</isAnonymous></author>
    <isDeleted>false</isDeleted>
    <isSpam>false</isSpam>
  </post>
</disqus>`

    const { getDisqusComments } = await setupMocks({ disqusXml: xml })
    const comments = getDisqusComments('/fallback-test')

    expect(comments).toHaveLength(1)
    expect(comments[0].author).toBe('fallback_user')
  })

  it('extracts UUID from thread link when id is not a UUID', async () => {
    const uuid = 'deadbeef-1234-1abc-89ab-0123456789ab'

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<disqus xmlns:dsq="http://disqus.com/disqus-internals">
  <thread dsq:id="t1"><id>not-a-uuid</id><link>https://eiriksm.dev/node/${uuid}</link></thread>
  <post dsq:id="p1">
    <thread dsq:id="t1" />
    <message>UUID in link</message>
    <createdAt>2023-09-01T00:00:00Z</createdAt>
    <author><name>Dave</name><username>dave</username><isAnonymous>false</isAnonymous></author>
    <isDeleted>false</isDeleted>
    <isSpam>false</isSpam>
  </post>
</disqus>`

    const { getDisqusComments } = await setupMocks({ disqusXml: xml })
    const comments = getDisqusComments(`/node/${uuid}`)
    expect(comments).toHaveLength(1)
    expect(comments[0].body).toBe('UUID in link')
  })

  it('returns empty array for empty disqus XML (no threads or posts)', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<disqus xmlns:dsq="http://disqus.com/disqus-internals">
</disqus>`

    const { getDisqusComments, getDisqusCommentCount } = await setupMocks({ disqusXml: xml })
    expect(getDisqusComments('/anything')).toEqual([])
    expect(getDisqusCommentCount('/anything')).toBe(0)
  })

  it('ignores posts referencing unknown threads', async () => {
    const xml = makeDisqusXml({
      threads: [{ id: 't1', link: 'https://eiriksm.dev/known' }],
      posts: [
        { id: 'p1', threadRef: 't1', message: 'Known thread' },
        { id: 'p2', threadRef: 't999', message: 'Unknown thread' },
      ],
    })

    const { getDisqusCommentCount } = await setupMocks({ disqusXml: xml })
    expect(getDisqusCommentCount('/known')).toBe(1)
  })

  it('handles path-uuid-map.json read errors gracefully', async () => {
    const xml = makeDisqusXml({
      threads: [{ id: 't1', link: 'https://eiriksm.dev/ok' }],
      posts: [{ id: 'p1', threadRef: 't1', message: 'Works' }],
    })

    const { getDisqusComments } = await setupMocks({
      disqusXml: xml,
      pathUuidMap: new Error('read error'),
    })
    expect(getDisqusComments('/ok')).toHaveLength(1)
  })

  it('caches results across multiple calls', async () => {
    const xml = makeDisqusXml({
      threads: [{ id: 't1', link: 'https://eiriksm.dev/cached' }],
      posts: [{ id: 'p1', threadRef: 't1', message: 'Cached comment' }],
    })

    const { getDisqusComments, getDisqusCommentCount, mockRead, mockExists } =
      await setupMocks({ disqusXml: xml })

    // Clear accumulated calls from module init before counting
    mockRead.mockClear()
    mockExists.mockClear()

    // Re-apply implementations after clearing
    mockExists.mockImplementation((p) => {
      if (typeof p === 'string' && p.endsWith('disqus.xml')) return true
      return false
    })
    mockRead.mockImplementation((p) => {
      if (typeof p === 'string' && p.endsWith('disqus.xml')) return xml
      return ''
    })

    // First call triggers parsing
    expect(getDisqusComments('/cached')).toHaveLength(1)

    const callsAfterFirst = mockRead.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].endsWith('disqus.xml')
    ).length

    // Second call should use cache (readFileSync not called again for disqus.xml)
    expect(getDisqusCommentCount('/cached')).toBe(1)

    const callsAfterSecond = mockRead.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].endsWith('disqus.xml')
    ).length

    expect(callsAfterSecond).toBe(callsAfterFirst)
  })
})
