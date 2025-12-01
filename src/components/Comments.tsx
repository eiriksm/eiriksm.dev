"use client"

import { useEffect, useState } from "react"
import { formatDate } from "@/lib/utils"

interface Comment {
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

interface CommentsProps {
  issueId: string
  initialComments?: Comment[]
}

export default function Comments({ issueId, initialComments = [] }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [loading, setLoading] = useState(initialComments.length === 0)
  const [error, setError] = useState<string | null>(null)
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || "eiriksm/eiriksm.dev-comments"
  const issueUrl = `https://github.com/${repo}/issues/${issueId}`

  useEffect(() => {
    if (initialComments.length > 0) {
      return
    }

    const fetchComments = async () => {
      try {
        const repo = process.env.NEXT_PUBLIC_GITHUB_REPO
        if (!repo) {
          setError("GitHub repository not configured")
          setLoading(false)
          return
        }

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
        setComments(data)
      } catch (err) {
        setError("Failed to load comments")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [issueId])

  const commentLink = (
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
  )

  if (loading) {
    return (
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold mb-6">Comments</h2>
        <div className="text-gray-500">Loading comments...</div>
        {commentLink}
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold mb-6">Comments</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-gray-700 mb-4">
            Comments for this post are hosted on GitHub Issues.
          </p>
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Comments on GitHub →
          </a>
        </div>
        {commentLink}
      </div>
    )
  }

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold mb-6">
        Comments ({comments.length})
      </h2>

      {comments.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-gray-700 mb-4">
            No comments yet. Be the first to comment on GitHub!
          </p>
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Comment on GitHub →
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="comment">
              <div className="flex items-start space-x-4">
                <img
                  src={comment.user.avatar_url}
                  alt={comment.user.login}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <a
                      href={comment.user.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="comment-author hover:text-blue-600"
                    >
                      {comment.user.login}
                    </a>
                    <span className="comment-date">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <div
                    className="comment-body prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: comment.body }}
                  />
                </div>
              </div>
            </div>
          ))}

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
        </div>
      )}
      {commentLink}
    </div>
  )
}
