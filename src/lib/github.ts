export function getIssueBase(repo: string): string {
  const issueBase = process.env.ISSUE_BASE || process.env.NEXT_PUBLIC_ISSUE_BASE
  const trimmedBase = issueBase?.replace(/\/$/, "")
  return trimmedBase || `https://api.github.com/repos/${repo}/issues`
}

export function getIssueUrl(issueId: string, repo: string): string {
  return `${getIssueBase(repo)}/${issueId}`
}

export function getIssueCommentsUrl(issueId: string, repo: string): string {
  return `${getIssueBase(repo)}/${issueId}/comments`
}
