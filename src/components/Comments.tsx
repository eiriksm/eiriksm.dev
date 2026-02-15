import { useEffect, useState, useMemo } from "react"
import { formatDate } from "@/lib/utils"
import type { DisqusComment } from "@/lib/disqus"
import { parseCommentBody } from "@/lib/comment-parser"
import { getIssueCommentsUrl } from "@/lib/github"

interface GitHubComment {
  id: number
  user: {
    login: string
    avatar_url: string
    html_url: string
  }
  created_at: string
  body: string
  html_url: string
}

interface UnifiedComment {
  id: string
  author: string
  avatarUrl?: string
  authorUrl?: string
  createdAt: string
  body: string
  source: "github" | "disqus"
}

interface CommentsProps {
  issueId?: string
  initialComments?: GitHubComment[]
  disqusComments?: DisqusComment[]
}

function normalizeGitHubComment(comment: GitHubComment): UnifiedComment {
  return {
    id: `github-${comment.id}`,
    author: comment.user.login,
    avatarUrl: comment.user.avatar_url,
    authorUrl: comment.user.html_url,
    createdAt: comment.created_at,
    body: comment.body,
    source: "github",
  }
}

function normalizeDisqusComment(comment: DisqusComment): UnifiedComment {
  return {
    id: `disqus-${comment.id}`,
    author: comment.author,
    createdAt: comment.createdAt,
    body: comment.body,
    source: "disqus",
  }
}

function getGravatarUrl(email?: string): string {
  // Default avatar for anonymous/unknown users
  if (!email) {
    return "https://www.gravatar.com/avatar/?d=mp&s=40"
  }
  // Simple hash for gravatar (in real use, you'd hash the email)
  return `https://www.gravatar.com/avatar/?d=identicon&s=40`
}

export default function Comments({ issueId, initialComments = [], disqusComments = [] }: CommentsProps) {
  const [githubComments, setGithubComments] = useState<GitHubComment[]>(initialComments)
  const [loading, setLoading] = useState(initialComments.length === 0 && !!issueId)
  const [error, setError] = useState<string | null>(null)
  const repo = (typeof import.meta !== "undefined" ? (import.meta as any).env?.PUBLIC_GITHUB_REPO : undefined) || "eiriksm/eiriksm.dev-comments"
  const issueUrl = issueId ? `https://github.com/${repo}/issues/${issueId}` : null

  // Merge and sort all comments by date
  const allComments: UnifiedComment[] = useMemo(() => [
    ...disqusComments.map(normalizeDisqusComment),
    ...githubComments.map(normalizeGitHubComment),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [disqusComments, githubComments])

  const commentCount = allComments.length
  const commentCountDisplay = `${commentCount}`.padStart(2, "0")
  const commentWord =
    commentCount === 1 ? "comment" : `comments${commentCount === 0 ? " 😿" : ""}`

  const commentHeader = (
    <div className="comment-header border-b-2 py-2 uppercase font-bold" style={{ borderColor: 'var(--border-color)' }}>
      <span className="count rounded text-lg p-1 font-mono" style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}>
        {commentCountDisplay}
      </span>
      <span> </span>
      {commentWord}
    </div>
  )

  useEffect(() => {
    if (!issueId) {
      return
    }

    const fetchComments = async () => {
      if (initialComments.length === 0) {
        setLoading(true)
      }

      try {
        const response = await fetch(
          getIssueCommentsUrl(issueId, repo)
        )

        if (!response.ok) {
          throw new Error("Failed to fetch comments")
        }

        const data = await response.json()
        setGithubComments(data)
      } catch (err) {
        if (initialComments.length === 0) {
          setError("Failed to load comments")
        }
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [issueId, initialComments.length, repo])

  const commentLink = issueUrl ? (
    <div className="comment-link-wrapper mt-6" style={{ color: 'var(--text-secondary)' }}>
      <p>Do you want to comment?</p>
      <p className="text-sm">
        This article uses GitHub for commenting. To comment, you can visit{" "}
        <a
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent-color)' }}
        >
          {issueUrl}
        </a>
        .
      </p>
    </div>
  ) : null

  if (loading) {
    return (
      <div className="comment-wrapper border-t-2 my-2 py-1 mt-12 pt-8" style={{ borderColor: 'var(--border-color)' }}>
        {commentHeader}
        <div className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading comments...</div>
        {commentLink}
      </div>
    )
  }

  if (error && disqusComments.length === 0) {
    return (
      <div className="comment-wrapper border-t-2 my-2 py-1 mt-12 pt-8" style={{ borderColor: 'var(--border-color)' }}>
        {commentHeader}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            Comments for this post are hosted on GitHub Issues.
          </p>
          {issueUrl && (
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}
            >
              View Comments on GitHub →
            </a>
          )}
        </div>
        {commentLink}
      </div>
    )
  }

  return (
    <div className="comment-wrapper border-t-2 my-2 py-1 mt-12 pt-8" style={{ borderColor: 'var(--border-color)' }}>
      {commentHeader}

      {allComments.length === 0 ? (
        <div className="rounded-lg p-6 mt-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            No comments yet. Be the first to comment on GitHub!
          </p>
          {issueUrl && (
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}
            >
              Add Comment on GitHub →
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-6 mt-4">
          {allComments.map((comment) => (
            <div key={comment.id} className="comment">
              <div className="flex items-start space-x-4">
                <img
                  src={comment.avatarUrl || getGravatarUrl()}
                  alt={comment.author}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {comment.authorUrl ? (
                      <a
                        href={comment.authorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="comment-author"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {comment.author}
                      </a>
                    ) : (
                      <span className="comment-author" style={{ color: 'var(--text-primary)' }}>{comment.author}</span>
                    )}
                    <span className="comment-date" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(comment.createdAt)}
                    </span>
                    {comment.source === "disqus" && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                        via Disqus
                      </span>
                    )}
                  </div>
                  <div
                    className="comment-body prose prose-sm w-full max-w-full min-w-0"
                    style={{ color: 'var(--text-secondary)' }}
                    dangerouslySetInnerHTML={{ __html: parseCommentBody(comment.body) }}
                  />
                </div>
              </div>
            </div>
          ))}

          {issueUrl && (
            <div className="mt-6">
              <a
                href={issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}
              >
                Add Comment on GitHub →
              </a>
            </div>
          )}
        </div>
      )}
      {commentLink}
    </div>
  )
}
