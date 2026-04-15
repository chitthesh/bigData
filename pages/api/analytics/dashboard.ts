import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { AdvancedGraphRepository } from '../../../repository/AdvancedGraphRepository'
import { computeCommunities, computeDegreeCentrality } from '../../../services/graphAnalytics'

type DashboardResponse = {
  totalUsers: number
  totalConnections: number
  topConnectedUsers: { username: string; connections: number; score: number }[]
  influentialUsers: { username: string; connections: number; score: number }[]
  communities: { id: number; members: string[] }[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end('Method Not Allowed')
    return
  }

  try {
    const usersSession = createSession()
    const edgeSession = createSession()
    const totalSession = createSession()

    try {
      const usersRepo = new AdvancedGraphRepository(usersSession)
      const edgeRepo = new AdvancedGraphRepository(edgeSession)
      const totalRepo = new AdvancedGraphRepository(totalSession)

      const usersResult = await usersRepo.getAllUsers()
      const edgeResult = await edgeRepo.getFriendEdges()
      const totalConnectionsResult = await totalRepo.totalConnections()

      const users = usersResult.records
        .map((record) => String(record.get('username')))
        .filter(Boolean)

      const edges = edgeResult.records
        .map((record) => ({
          source: String(record.get('source')),
          target: String(record.get('target'))
        }))
        .filter((edge) => edge.source && edge.target)

      const degreeCentrality = computeDegreeCentrality(users, edges)
      const communities = computeCommunities(users, edges)

      const payload: DashboardResponse = {
        totalUsers: users.length,
        totalConnections: Number(totalConnectionsResult.records[0]?.get('totalConnections') ?? edges.length),
        topConnectedUsers: degreeCentrality.slice(0, 5),
        influentialUsers: degreeCentrality.slice(0, 5),
        communities
      }

      res.status(200).json(payload)
    } finally {
      await Promise.all([usersSession.close(), edgeSession.close(), totalSession.close()])
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to load dashboard analytics' })
  }
}
