import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.unstubAllEnvs()
})

describe('getIssueBase', () => {
  it('returns GitHub API URL when no env vars are set', async () => {
    vi.stubEnv('ISSUE_BASE', '')
    vi.stubEnv('NEXT_PUBLIC_ISSUE_BASE', '')
    const { getIssueBase } = await import('./github')
    expect(getIssueBase('eiriksm/eiriksm.dev')).toBe(
      'https://api.github.com/repos/eiriksm/eiriksm.dev/issues'
    )
  })

  it('uses ISSUE_BASE env var when set', async () => {
    vi.stubEnv('ISSUE_BASE', 'https://custom.api/issues')
    vi.stubEnv('NEXT_PUBLIC_ISSUE_BASE', '')
    const { getIssueBase } = await import('./github')
    expect(getIssueBase('eiriksm/eiriksm.dev')).toBe('https://custom.api/issues')
  })

  it('uses NEXT_PUBLIC_ISSUE_BASE when ISSUE_BASE is not set', async () => {
    vi.stubEnv('ISSUE_BASE', '')
    vi.stubEnv('NEXT_PUBLIC_ISSUE_BASE', 'https://public.api/issues')
    const { getIssueBase } = await import('./github')
    expect(getIssueBase('eiriksm/eiriksm.dev')).toBe('https://public.api/issues')
  })

  it('prefers ISSUE_BASE over NEXT_PUBLIC_ISSUE_BASE', async () => {
    vi.stubEnv('ISSUE_BASE', 'https://primary.api/issues')
    vi.stubEnv('NEXT_PUBLIC_ISSUE_BASE', 'https://fallback.api/issues')
    const { getIssueBase } = await import('./github')
    expect(getIssueBase('eiriksm/eiriksm.dev')).toBe('https://primary.api/issues')
  })

  it('strips trailing slash from env var', async () => {
    vi.stubEnv('ISSUE_BASE', 'https://custom.api/issues/')
    const { getIssueBase } = await import('./github')
    expect(getIssueBase('eiriksm/eiriksm.dev')).toBe('https://custom.api/issues')
  })
})

describe('getIssueUrl', () => {
  it('returns correct issue URL using default base', async () => {
    vi.stubEnv('ISSUE_BASE', '')
    vi.stubEnv('NEXT_PUBLIC_ISSUE_BASE', '')
    const { getIssueUrl } = await import('./github')
    expect(getIssueUrl('42', 'eiriksm/eiriksm.dev')).toBe(
      'https://api.github.com/repos/eiriksm/eiriksm.dev/issues/42'
    )
  })

  it('returns correct issue URL using custom base', async () => {
    vi.stubEnv('ISSUE_BASE', 'https://custom.api/issues')
    const { getIssueUrl } = await import('./github')
    expect(getIssueUrl('7', 'any/repo')).toBe('https://custom.api/issues/7')
  })
})

describe('getIssueCommentsUrl', () => {
  it('returns correct comments URL using default base', async () => {
    vi.stubEnv('ISSUE_BASE', '')
    vi.stubEnv('NEXT_PUBLIC_ISSUE_BASE', '')
    const { getIssueCommentsUrl } = await import('./github')
    expect(getIssueCommentsUrl('42', 'eiriksm/eiriksm.dev')).toBe(
      'https://api.github.com/repos/eiriksm/eiriksm.dev/issues/42/comments'
    )
  })

  it('returns correct comments URL using custom base', async () => {
    vi.stubEnv('ISSUE_BASE', 'https://custom.api/issues')
    const { getIssueCommentsUrl } = await import('./github')
    expect(getIssueCommentsUrl('7', 'any/repo')).toBe(
      'https://custom.api/issues/7/comments'
    )
  })

  it('handles trailing slash in base URL correctly', async () => {
    vi.stubEnv('ISSUE_BASE', 'https://custom.api/issues/')
    const { getIssueCommentsUrl } = await import('./github')
    expect(getIssueCommentsUrl('10', 'any/repo')).toBe(
      'https://custom.api/issues/10/comments'
    )
  })
})
