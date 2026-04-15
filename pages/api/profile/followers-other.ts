import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { UserRepository } from '../../../repository/UserRepository'

type FollowersOtherResponse = {
  followers: { follower_username: string; following: number }[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const username = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username
  const viewer = Array.isArray(req.query.viewer) ? req.query.viewer[0] : req.query.viewer

  if (!username || !viewer) {
    res.status(400).json({ error: 'username and viewer are required' })
    return
  }

  const session = createSession()
  const repo = new UserRepository(session)

  try {
    const result = await repo.getProfileFollower(username, viewer)
    const followers = result.records.map((record) => ({
      follower_username: String(record.get('follower_username')),
      following: Number(record.get('following'))
    }))

    const payload: FollowersOtherResponse = { followers }
    res.status(200).json(payload)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Neo4j request failed' })
  } finally {
    await session.close()
  }
}
