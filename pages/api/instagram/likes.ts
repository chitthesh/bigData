import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { InstagramRepository } from '../../../repository/InstagramRepository'
import { parseJsonBody } from '../_utils'

type LikeBody = {
  username?: string
  postId?: string
  action?: 'like' | 'unlike'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const body = parseJsonBody<LikeBody>(req)
  const username = body.username?.trim() ?? ''
  const postId = body.postId?.trim() ?? ''
  const action = body.action ?? 'like'

  if (!username || !postId) {
    res.status(400).json({ error: 'username and postId are required' })
    return
  }

  const session = createSession()
  const repo = new InstagramRepository(session)

  try {
    const accessResult = await repo.canViewerAccessPost(postId, username)
    const allowed = Boolean(accessResult.records[0]?.get('allowed') ?? false)
    if (!allowed) {
      res.status(403).json({ error: 'You do not have access to this post' })
      return
    }

    if (action === 'unlike') {
      await repo.unlikePost(username, postId)
      res.status(200).json({ ok: true })
      return
    }

    await repo.likePost(username, postId)

    const authorResult = await repo.getPostAuthor(postId)
    const author = String(authorResult.records[0]?.get('username') ?? '')
    if (author && author !== username) {
      await repo.createNotification(author, 'like', `@${username} liked your post`, Date.now())
    }

    res.status(200).json({ ok: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update like' })
  } finally {
    await session.close()
  }
}
