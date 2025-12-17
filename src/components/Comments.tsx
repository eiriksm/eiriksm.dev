"use client"

import { useEffect, useState } from "react"
import { formatDate } from "@/lib/utils"
import type { DisqusComment } from "@/lib/disqus"

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
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || "eiriksm/eiriksm.dev-comments"
  const issueUrl = issueId ? `https://github.com/${repo}/issues/${issueId}` : null

  // Merge and sort all comments by date
  const allComments: UnifiedComment[] = [
    ...disqusComments.map(normalizeDisqusComment),
    ...githubComments.map(normalizeGitHubComment),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const commentCount = allComments.length
  const commentCountDisplay = `${commentCount}`.padStart(2, "0")
  const commentWord =
    commentCount === 1 ? "comment" : `comments${commentCount === 0 ? " 😿" : ""}`

  const commentHeader = (
    <div className="comment-header border-b-2 py-2 uppercase font-bold">
      <span className="count bg-blue-800 text-white rounded text-lg p-1 font-mono">
        {commentCountDisplay}
      </span>
      <span> </span>
      {commentWord}
    </div>
  )

  useEffect(() => {
    if (initialComments.length > 0 || !issueId) {
      return
    }

    const fetchComments = async () => {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${repo}/issues/${issueId}/comments`,
          {
            headers: process.env.GITHUB_TOKEN
              ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
              : {},
          }
        )

        if (!response.ok) {
          throw new Error("Failed to fetch comments")
        }

        const data = await response.json()
        setGithubComments(data)
      } catch (err) {
        setError("Failed to load comments")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [issueId, initialComments.length, repo])

  const commentLink = issueUrl ? (
    <div className="comment-link-wrapper mt-6">
      <p>Do you want to comment?</p>
      <p className="text-sm">
        This article uses github for commenting. To comment, you can visit{" "}
        <a
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {issueUrl}
        </a>
        .
      </p>
    </div>
  ) : null

  if (loading) {
    return (
      <div className="comment-wrapper border-t-2 my-2 py-1 mt-12 pt-8 border-gray-200">
        {commentHeader}
        <div className="text-gray-500 mt-4">Loading comments...</div>
        {commentLink}
      </div>
    )
  }

  if (error && disqusComments.length === 0) {
    return (
      <div className="comment-wrapper border-t-2 my-2 py-1 mt-12 pt-8 border-gray-200">
        {commentHeader}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-gray-700 mb-4">
            Comments for this post are hosted on GitHub Issues.
          </p>
          {issueUrl && (
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
    <div className="comment-wrapper border-t-2 my-2 py-1 mt-12 pt-8 border-gray-200">
      {commentHeader}

      {allComments.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-gray-700 mb-4">
            No comments yet. Be the first to comment on GitHub!
          </p>
          {issueUrl && (
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Comment on GitHub →
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {allComments.map((comment) => (
            <div key={comment.id} className="comment">
              <div className="flex items-start space-x-4">
                <img
                  src={comment.avatarUrl || getGravatarUrl()}
                  alt={comment.author}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {comment.authorUrl ? (
                      <a
                        href={comment.authorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="comment-author hover:text-blue-600"
                      >
                        {comment.author}
                      </a>
                    ) : (
                      <span className="comment-author">{comment.author}</span>
                    )}
                    <span className="comment-date">
                      {formatDate(comment.createdAt)}
                    </span>
                    {comment.source === "disqus" && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        via Disqus
                      </span>
                    )}
                  </div>
                  <div
                    className="comment-body prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: comment.body }}
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
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
