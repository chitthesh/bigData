import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { InstagramRepository } from '../../../repository/InstagramRepository'
import { parseJsonBody } from '../_utils'

type FollowBody = {
  from?: string
  to?: string
  action?: 'follow' | 'unfollow'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = createSession()
  const repo = new InstagramRepository(session)

  try {
    if (req.method === 'GET') {
      const username = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username
      const viewer = Array.isArray(req.query.viewer) ? req.query.viewer[0] : req.query.viewer
      const list = Array.isArray(req.query.list) ? req.query.list[0] : req.query.list
      const limitRaw = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit
      const limit = limitRaw ? Math.max(1, Math.floor(Number(limitRaw))) : 50

      if (!username) {
        res.status(400).json({ error: 'username is required' })
        return
      }

      const statsResult = await repo.getUserStats(username, viewer)
      const record = statsResult.records[0]

      const responsePayload: {
        username: string
        followers: number
        following: number
        posts: number
        isFollowing: boolean
        users?: { username: string }[]
      } = {
        username,
        followers: Number(record?.get('followers') ?? 0),
        following: Number(record?.get('following') ?? 0),
        posts: Number(record?.get('posts') ?? 0),
        isFollowing: Boolean(record?.get('isFollowing') ?? false)
      }

      if (list === 'followers') {
        const followerResult = await repo.getFollowers(username, limit)
        responsePayload.users = followerResult.records.map((item) => ({ username: String(item.get('username')) }))
      }

      if (list === 'following') {
        const followingResult = await repo.getFollowing(username, limit)
        responsePayload.users = followingResult.records.map((item) => ({ username: String(item.get('username')) }))
      }

      if (list === 'mutual' && viewer && viewer !== username) {
        const mutualResult = await repo.getMutualFollowing(username, viewer, limit)
        responsePayload.users = mutualResult.records.map((item) => ({ username: String(item.get('username')) }))
      }

      res.status(200).json(responsePayload)
      return
    }

    if (req.method === 'POST') {
      const body = parseJsonBody<FollowBody>(req)
      const from = body.from?.trim() ?? ''
      const to = body.to?.trim() ?? ''
      const action = body.action ?? 'follow'

      if (!from || !to) {
        res.status(400).json({ error: 'from and to are required' })
        return
      }

      if (from === to) {
        res.status(400).json({ error: 'A user cannot follow themselves' })
        return
      }

      if (action === 'unfollow') {
        await repo.unfollow(from, to)
      } else {
        await repo.follow(from, to)
        await repo.createNotification(to, 'follow', `@${from} started following you`, Date.now())
      }

      const statsResult = await repo.getUserStats(to, from)
      const record = statsResult.records[0]

      res.status(200).json({
        ok: true,
        followers: Number(record?.get('followers') ?? 0),
        following: Number(record?.get('following') ?? 0),
        posts: Number(record?.get('posts') ?? 0),
        isFollowing: Boolean(record?.get('isFollowing') ?? false)
      })
      return
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end('Method Not Allowed')
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to handle follows' })
  } finally {
    await session.close()
  }
}
