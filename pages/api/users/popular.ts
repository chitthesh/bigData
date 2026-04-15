import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { SocialGraphRepository } from '../../../repository/SocialGraphRepository'

type PopularResponse = {
  users: { username: string; connections: number }[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const limitRaw = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit
  const limit = limitRaw ? Math.floor(Number(limitRaw)) : 5

  const session = createSession()
  const repo = new SocialGraphRepository(session)

  try {
    const safeLimit = Number.isFinite(limit) && limit >= 0 ? limit : 5
    const result = await repo.popularUsers(safeLimit)
    const users = result.records
      .map((record) => ({
        username: record.get('username'),
        connections: Number(record.get('connections'))
      }))
      .filter((user) => typeof user.username === 'string' && user.username.trim().length > 0)
      .map((user) => ({
        username: user.username.trim(),
        connections: user.connections
      }))

    const payload: PopularResponse = { users }
    res.status(200).json(payload)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch popular users' })
  } finally {
    await session.close()
  }
}
