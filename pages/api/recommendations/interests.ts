import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { AdvancedGraphRepository } from '../../../repository/AdvancedGraphRepository'
import { computeInterestRecommendations } from '../../../services/graphAnalytics'

type RecommendationResponse = {
  recommendations: { username: string; score: number; mutualFriends: number; sharedInterests: number }[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const username = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username
  const limitRaw = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit
  const limit = limitRaw ? Math.max(0, Math.floor(Number(limitRaw))) : 8

  if (!username) {
    res.status(400).json({ error: 'username is required' })
    return
  }

  try {
    const usersSession = createSession()
    const edgesSession = createSession()
    const likesSession = createSession()

    try {
      const usersRepo = new AdvancedGraphRepository(usersSession)
      const edgesRepo = new AdvancedGraphRepository(edgesSession)
      const likesRepo = new AdvancedGraphRepository(likesSession)

      const usersResult = await usersRepo.getAllUsers()
      const edgeResult = await edgesRepo.getFriendEdges()
      const likesResult = await likesRepo.getLikes()

      const users = usersResult.records.map((record) => String(record.get('username'))).filter(Boolean)
      const edges = edgeResult.records.map((record) => ({
        source: String(record.get('source')),
        target: String(record.get('target'))
      }))
      const interests = likesResult.records.map((record) => ({
        username: String(record.get('username')),
        interest: String(record.get('interest'))
      }))

      const recommendations = computeInterestRecommendations(username, users, edges, interests).slice(0, limit)
      const payload: RecommendationResponse = { recommendations }

      res.status(200).json(payload)
    } finally {
      await Promise.all([usersSession.close(), edgesSession.close(), likesSession.close()])
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to load interest recommendations' })
  }
}
