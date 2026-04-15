import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { SocialGraphRepository } from '../../../repository/SocialGraphRepository'

type PathResponse = {
  path: string[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const userA = Array.isArray(req.query.userA) ? req.query.userA[0] : req.query.userA
  const userB = Array.isArray(req.query.userB) ? req.query.userB[0] : req.query.userB
  const maxDepthRaw = Array.isArray(req.query.maxDepth) ? req.query.maxDepth[0] : req.query.maxDepth
  const maxDepth = maxDepthRaw ? Number(maxDepthRaw) : 6

  if (!userA || !userB) {
    res.status(400).json({ error: 'userA and userB are required' })
    return
  }

  if (userA === userB) {
    const payload: PathResponse = { path: [userA] }
    res.status(200).json(payload)
    return
  }

  const session = createSession()
  const repo = new SocialGraphRepository(session)

  try {
    const result = await repo.shortestPath(userA, userB, Number.isFinite(maxDepth) ? maxDepth : 6)
    const record = result.records[0]
    const path = record ? (record.get('path') as string[]) : []

    const payload: PathResponse = { path }
    res.status(200).json(payload)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch shortest path' })
  } finally {
    await session.close()
  }
}
