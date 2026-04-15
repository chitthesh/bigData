import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { SocialGraphRepository } from '../../../repository/SocialGraphRepository'

type MutualResponse = {
  mutual: { username: string }[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const userA = Array.isArray(req.query.userA) ? req.query.userA[0] : req.query.userA
  const userB = Array.isArray(req.query.userB) ? req.query.userB[0] : req.query.userB

  if (!userA || !userB) {
    res.status(400).json({ error: 'userA and userB are required' })
    return
  }

  if (userA === userB) {
    const payload: MutualResponse = { mutual: [] }
    res.status(200).json(payload)
    return
  }

  const session = createSession()
  const repo = new SocialGraphRepository(session)

  try {
    const result = await repo.mutualFriends(userA, userB)
    const mutual = result.records.map((record) => ({
      username: String(record.get('username'))
    }))

    const payload: MutualResponse = { mutual }
    res.status(200).json(payload)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch mutual friends' })
  } finally {
    await session.close()
  }
}
