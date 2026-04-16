import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { InstagramRepository } from '../../../repository/InstagramRepository'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const username = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username
  const limitRaw = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit
  const pageRaw = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page
  const limit = limitRaw ? Math.max(1, Math.floor(Number(limitRaw))) : 30
  const page = pageRaw ? Math.max(1, Math.floor(Number(pageRaw))) : 1
  const skip = (page - 1) * limit

  if (!username) {
    res.status(400).json({ error: 'username is required' })
    return
  }

  const session = createSession()
  const repo = new InstagramRepository(session)

  try {
    const result = await repo.getFeed(username, limit + 1, skip)
    const rows = result.records.map((record) => ({
      id: String(record.get('id')),
      author: String(record.get('author')),
      caption: String(record.get('caption') ?? ''),
      imageUrl: String(record.get('imageUrl') ?? ''),
      visibility: record.get('visibility') === 'public' ? 'public' : 'followers',
      createdAt: Number(record.get('createdAt') ?? 0),
      likes: Number(record.get('likes') ?? 0),
      comments: Number(record.get('comments') ?? 0),
      likedByViewer: Boolean(record.get('likedByViewer') ?? false)
    }))
    const hasMore = rows.length > limit
    const posts = hasMore ? rows.slice(0, limit) : rows

    res.status(200).json({ posts, page, hasMore })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to load feed' })
  } finally {
    await session.close()
  }
}
