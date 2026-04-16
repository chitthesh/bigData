import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { InstagramRepository } from '../../../repository/InstagramRepository'
import { parseJsonBody } from '../_utils'

type AddCommentBody = {
  username?: string
  postId?: string
  text?: string
}

type DeleteCommentBody = {
  username?: string
  postId?: string
  commentId?: string
  createdAt?: number
  text?: string
}

function makeCommentId() {
  return `comment_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = createSession()
  const repo = new InstagramRepository(session)

  try {
    if (req.method === 'GET') {
      const postId = Array.isArray(req.query.postId) ? req.query.postId[0] : req.query.postId
      const viewer = Array.isArray(req.query.viewer) ? req.query.viewer[0] : req.query.viewer
      const limitRaw = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit
      const pageRaw = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page
      const limit = limitRaw ? Math.max(1, Math.floor(Number(limitRaw))) : 20
      const page = pageRaw ? Math.max(1, Math.floor(Number(pageRaw))) : 1
      const skip = (page - 1) * limit

      if (!postId) {
        res.status(400).json({ error: 'postId is required' })
        return
      }

      const accessResult = await repo.canViewerAccessPost(postId, viewer)
      const allowed = Boolean(accessResult.records[0]?.get('allowed') ?? false)
      if (!allowed) {
        res.status(403).json({ error: 'You do not have access to this post' })
        return
      }

      const result = await repo.getComments(postId, limit + 1, skip)
      const rows = result.records.map((record) => {
        const id = String(record.get('id') ?? '')
        const username = String(record.get('username'))
        return {
          id,
          username,
          text: String(record.get('text')),
          createdAt: Number(record.get('createdAt')),
          canDelete: !!viewer && viewer === username
        }
      })
      const hasMore = rows.length > limit
      const comments = hasMore ? rows.slice(0, limit) : rows

      res.status(200).json({ comments, page, hasMore })
      return
    }

    if (req.method === 'POST') {
      const body = parseJsonBody<AddCommentBody>(req)
      const username = body.username?.trim() ?? ''
      const postId = body.postId?.trim() ?? ''
      const text = body.text?.trim() ?? ''

      if (!username || !postId || !text) {
        res.status(400).json({ error: 'username, postId and text are required' })
        return
      }

      const accessResult = await repo.canViewerAccessPost(postId, username)
      const allowed = Boolean(accessResult.records[0]?.get('allowed') ?? false)
      if (!allowed) {
        res.status(403).json({ error: 'You do not have access to this post' })
        return
      }

      await repo.addComment(username, postId, makeCommentId(), text, Date.now())

      const authorResult = await repo.getPostAuthor(postId)
      const author = String(authorResult.records[0]?.get('username') ?? '')
      if (author && author !== username) {
        await repo.createNotification(author, 'comment', `@${username} commented on your post`, Date.now())
      }

      res.status(200).json({ ok: true })
      return
    }

    if (req.method === 'DELETE') {
      const body = parseJsonBody<DeleteCommentBody>(req)
      const username = body.username?.trim() ?? ''
      const postId = body.postId?.trim() ?? ''
      const commentId = body.commentId?.trim() ?? ''
      const createdAt = Number(body.createdAt ?? 0)
      const text = body.text?.trim() ?? ''

      if (!username || !postId) {
        res.status(400).json({ error: 'username and postId are required' })
        return
      }

      const accessResult = await repo.canViewerAccessPost(postId, username)
      const allowed = Boolean(accessResult.records[0]?.get('allowed') ?? false)
      if (!allowed) {
        res.status(403).json({ error: 'You do not have access to this post' })
        return
      }

      if (commentId) {
        await repo.deleteComment(username, postId, commentId)
      } else if (createdAt && text) {
        await repo.deleteCommentByFingerprint(username, postId, createdAt, text)
      } else {
        res.status(400).json({ error: 'commentId or (createdAt and text) are required' })
        return
      }

      res.status(200).json({ ok: true })
      return
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    res.status(405).end('Method Not Allowed')
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to handle comments' })
  } finally {
    await session.close()
  }
}
