import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { InstagramRepository } from '../../../repository/InstagramRepository'
import { parseJsonBody } from '../_utils'

type CreatePostBody = {
  author?: string
  caption?: string
  imageUrl?: string
}

type UpdatePostBody = {
  author?: string
  postId?: string
  caption?: string
  imageUrl?: string
}

type DeletePostBody = {
  author?: string
  postId?: string
}

function makePostId() {
  return `post_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = createSession()
  const repo = new InstagramRepository(session)

  try {
    if (req.method === 'GET') {
      const username = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username
      const viewer = Array.isArray(req.query.viewer) ? req.query.viewer[0] : req.query.viewer
      const limitRaw = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit
      const pageRaw = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page
      const limit = limitRaw ? Math.max(1, Math.floor(Number(limitRaw))) : 24
      const page = pageRaw ? Math.max(1, Math.floor(Number(pageRaw))) : 1
      const skip = (page - 1) * limit

      if (!username) {
        res.status(400).json({ error: 'username is required' })
        return
      }

      const result = await repo.getUserPosts(username, viewer, limit + 1, skip)
      const rows = result.records.map((record) => ({
        id: String(record.get('id')),
        author: String(record.get('author')),
        caption: String(record.get('caption') ?? ''),
        imageUrl: String(record.get('imageUrl') ?? ''),
        createdAt: Number(record.get('createdAt') ?? 0),
        likes: Number(record.get('likes') ?? 0),
        comments: Number(record.get('comments') ?? 0),
        likedByViewer: Boolean(record.get('likedByViewer') ?? false)
      }))
      const hasMore = rows.length > limit
      const posts = hasMore ? rows.slice(0, limit) : rows

      res.status(200).json({ posts, page, hasMore })
      return
    }

    if (req.method === 'POST') {
      const body = parseJsonBody<CreatePostBody>(req)
      const author = body.author?.trim() ?? ''
      const caption = body.caption?.trim() ?? ''
      const imageUrl = body.imageUrl?.trim() ?? ''

      if (!author || !imageUrl) {
        res.status(400).json({ error: 'author and imageUrl are required' })
        return
      }

      const id = makePostId()
      const createdAt = Date.now()
      await repo.createPost(author, id, caption, imageUrl, createdAt)

      res.status(200).json({ ok: true, id, createdAt })
      return
    }

    if (req.method === 'PATCH') {
      const body = parseJsonBody<UpdatePostBody>(req)
      const author = body.author?.trim() ?? ''
      const postId = body.postId?.trim() ?? ''
      const caption = body.caption?.trim() ?? ''
      const imageUrl = body.imageUrl?.trim() ?? ''

      if (!author || !postId || !imageUrl) {
        res.status(400).json({ error: 'author, postId and imageUrl are required' })
        return
      }

      await repo.updatePost(author, postId, caption, imageUrl)
      res.status(200).json({ ok: true })
      return
    }

    if (req.method === 'DELETE') {
      const body = parseJsonBody<DeletePostBody>(req)
      const author = body.author?.trim() ?? ''
      const postId = body.postId?.trim() ?? ''

      if (!author || !postId) {
        res.status(400).json({ error: 'author and postId are required' })
        return
      }

      await repo.deletePost(author, postId)
      res.status(200).json({ ok: true })
      return
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE'])
    res.status(405).end('Method Not Allowed')
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to handle posts' })
  } finally {
    await session.close()
  }
}
