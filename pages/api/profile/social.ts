import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { UserRepository } from '../../../repository/UserRepository'

type SocialResponse = {
  followme: number
  followother: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const from = Array.isArray(req.query.from) ? req.query.from[0] : req.query.from
  const to = Array.isArray(req.query.to) ? req.query.to[0] : req.query.to

  if (!from || !to) {
    res.status(400).json({ error: 'from and to are required' })
    return
  }

  const session = createSession()
  const repo = new UserRepository(session)

  try {
    const result = await repo.sosialFollowButton(from, to)
    const record = result.records[0]

    const payload: SocialResponse = {
      followme: record ? Number(record.get('followme')) : 0,
      followother: record ? Number(record.get('followother')) : 0
    }

    res.status(200).json(payload)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Neo4j request failed' })
  } finally {
    await session.close()
  }
}
