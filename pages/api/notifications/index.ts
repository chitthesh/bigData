import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { AdvancedGraphRepository } from '../../../repository/AdvancedGraphRepository'

type NotificationsResponse = {
  notifications: { type: string; text: string; createdAt: number }[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const username = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username
  const limitRaw = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit
  const limit = limitRaw ? Math.max(0, Math.floor(Number(limitRaw))) : 10

  if (!username) {
    res.status(400).json({ error: 'username is required' })
    return
  }

  const session = createSession()
  const repo = new AdvancedGraphRepository(session)

  try {
    const result = await repo.getNotifications(username, limit)
    const payload: NotificationsResponse = {
      notifications: result.records.map((record) => ({
        type: String(record.get('type')),
        text: String(record.get('text')),
        createdAt: Number(record.get('createdAt'))
      }))
    }

    res.status(200).json(payload)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to load notifications' })
  } finally {
    await session.close()
  }
}
