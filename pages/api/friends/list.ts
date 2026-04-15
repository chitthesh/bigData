import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { SocialGraphRepository } from '../../../repository/SocialGraphRepository'

type FriendsResponse = {
  friends: { username: string; connections: number }[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const username = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username

  if (!username) {
    res.status(400).json({ error: 'username is required' })
    return
  }

  const session = createSession()
  const repo = new SocialGraphRepository(session)

  try {
    const result = await repo.getFriends(username)
    const friends = result.records
      .map((record) => ({
        username: record.get('username'),
        connections: Number(record.get('connections'))
      }))
      .filter((friend) => typeof friend.username === 'string' && friend.username.trim().length > 0)
      .map((friend) => ({
        username: friend.username.trim(),
        connections: friend.connections
      }))

    const payload: FriendsResponse = { friends }
    res.status(200).json(payload)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch friends' })
  } finally {
    await session.close()
  }
}
