import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'

import type { CommentItem, FeedPost } from '../types/instagram'
import { useUserContext } from './UserContext'

type PostCardProps = {
  post: FeedPost
  onRefresh: () => Promise<void>
}

function formatDate(epochMillis: number): string {
  if (!epochMillis) {
    return ''
  }

  return new Date(epochMillis).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function PostCard({ post, onRefresh }: PostCardProps) {
  const { currentUser } = useUserContext()
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<CommentItem[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentPage, setCommentPage] = useState(1)
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editCaption, setEditCaption] = useState(post.caption)
  const [editImageUrl, setEditImageUrl] = useState(post.imageUrl)
  const commentSentinelRef = useRef<HTMLDivElement | null>(null)
  const fetchingMoreCommentsRef = useRef(false)

  const canManagePost = currentUser === post.author

  async function loadComments(pageToLoad: number, append: boolean) {
    try {
      setLoadingComments(true)
      const response = await fetch(
        `/api/instagram/comments?postId=${encodeURIComponent(post.id)}&limit=3&page=${pageToLoad}&viewer=${encodeURIComponent(
          currentUser ?? ''
        )}`
      )

      if (!response.ok) {
        throw new Error('Failed to load comments')
      }

      const data = await response.json()
      const incoming = Array.isArray(data.comments) ? data.comments : []

      setComments((previous) => (append ? [...previous, ...incoming] : incoming))
      setHasMoreComments(Boolean(data.hasMore))
      setCommentPage(pageToLoad)
    } finally {
      setLoadingComments(false)
    }
  }

  useEffect(() => {
    setEditCaption(post.caption)
    setEditImageUrl(post.imageUrl)
    loadComments(1, false)
      .catch((error) => console.error(error))
  }, [post.id, post.comments, currentUser])

  useEffect(() => {
    const node = commentSentinelRef.current
    if (!node || !hasMoreComments) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (!first?.isIntersecting || loadingComments || fetchingMoreCommentsRef.current) {
          return
        }

        fetchingMoreCommentsRef.current = true
        loadComments(commentPage + 1, true)
          .catch((error) => console.error(error))
          .finally(() => {
            fetchingMoreCommentsRef.current = false
          })
      },
      { threshold: 0.2 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMoreComments, loadingComments, commentPage, post.id, currentUser])

  async function toggleLike() {
    if (!currentUser) {
      return
    }

    const response = await fetch('/api/instagram/likes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: currentUser,
        postId: post.id,
        action: post.likedByViewer ? 'unlike' : 'like'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to update like')
    }

    await onRefresh()
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentUser || !commentText.trim()) {
      return
    }

    const response = await fetch('/api/instagram/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: currentUser,
        postId: post.id,
        text: commentText.trim()
      })
    })

    if (!response.ok) {
      throw new Error('Failed to add comment')
    }

    setCommentText('')
    await onRefresh()
  }

  async function deleteComment(comment: CommentItem) {
    if (!currentUser) {
      return
    }

    const payload = comment.id
      ? { username: currentUser, postId: post.id, commentId: comment.id }
      : { username: currentUser, postId: post.id, createdAt: comment.createdAt, text: comment.text }

    const response = await fetch('/api/instagram/comments', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error('Failed to delete comment')
    }

    await onRefresh()
  }

  async function submitPostEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canManagePost) {
      return
    }

    const response = await fetch('/api/instagram/posts', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        author: currentUser,
        postId: post.id,
        caption: editCaption,
        imageUrl: editImageUrl
      })
    })

    if (!response.ok) {
      throw new Error('Failed to edit post')
    }

    setEditing(false)
    await onRefresh()
  }

  async function removePost() {
    if (!canManagePost) {
      return
    }

    const ok = confirm('Delete this post permanently?')
    if (!ok) {
      return
    }

    const response = await fetch('/api/instagram/posts', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ author: currentUser, postId: post.id })
    })

    if (!response.ok) {
      throw new Error('Failed to delete post')
    }

    await onRefresh()
  }

  return (
    <article className="group overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-orange-400 text-xs font-bold text-white">
            {post.author.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <Link href={`/profile/${encodeURIComponent(post.author)}`} className="text-sm font-semibold text-slate-900 hover:text-slate-700">
              @{post.author}
            </Link>
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Creator</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">{formatDate(post.createdAt)}</span>
      </div>

      {editing ? (
        <form onSubmit={(event) => submitPostEdit(event).catch((error) => console.error(error))} className="space-y-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
          <input
            value={editImageUrl}
            onChange={(event) => setEditImageUrl(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            placeholder="Image URL"
            required
          />
          <input
            value={editCaption}
            onChange={(event) => setEditCaption(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            placeholder="Caption"
          />
          <div className="flex gap-2">
            <button type="submit" className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <img src={post.imageUrl} alt={`Post by ${post.author}`} className="h-[22rem] w-full object-cover transition duration-500 group-hover:scale-[1.01]" />

      <div className="space-y-3 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
            {post.visibility === 'public' ? 'Public' : 'Followers only'}
          </span>
          <button
            onClick={() => toggleLike().catch((error) => console.error(error))}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              post.likedByViewer ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            disabled={!currentUser}
          >
            {post.likedByViewer ? 'Liked' : 'Like'}
          </button>
          <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-semibold text-fuchsia-700">{post.likes} likes</span>
          <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">{post.comments} comments</span>
          {canManagePost ? (
            <>
              <button onClick={() => setEditing(true)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200">
                Edit
              </button>
              <button onClick={() => removePost().catch((error) => console.error(error))} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-200">
                Delete
              </button>
            </>
          ) : null}
        </div>

        {post.caption ? (
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-sm text-slate-800">
              <span className="font-semibold text-slate-900">@{post.author}</span> {post.caption}
            </p>
          </div>
        ) : null}

        {post.location ? (
          <p className="text-xs font-medium text-slate-500">Location: {post.location}</p>
        ) : null}

        {post.altText ? (
          <p className="text-xs text-slate-400">Alt text: {post.altText}</p>
        ) : null}

        <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-2">
          {loadingComments ? <p className="text-xs text-slate-400">Loading comments...</p> : null}
          {comments.map((comment, index) => (
            <div key={`${comment.id}-${comment.createdAt}-${index}`} className="flex items-start justify-between gap-2">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">@{comment.username}</span> {comment.text}
              </p>
              {comment.canDelete ? (
                <button
                  onClick={() => deleteComment(comment).catch((error) => console.error(error))}
                  className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600"
                >
                  Delete
                </button>
              ) : null}
            </div>
          ))}

          {hasMoreComments ? (
            <div ref={commentSentinelRef} className="rounded-lg border border-dashed border-slate-200 px-2 py-1 text-center text-[11px] text-slate-500">
              {loadingComments ? 'Loading more comments...' : 'Scroll to load more comments'}
            </div>
          ) : null}
        </div>

        <form onSubmit={(event) => submitComment(event).catch((error) => console.error(error))} className="flex gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2">
          <input
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            placeholder="Add a comment..."
            disabled={!currentUser}
          />
          <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={!currentUser || !commentText.trim()}>
            Post
          </button>
        </form>
      </div>
    </article>
  )
}

export { PostCard }
