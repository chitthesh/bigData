import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { SocialGraphRepository } from '../../../repository/SocialGraphRepository'

type SuggestionsResponse = {
  suggestions: { username: string; connections: number }[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const username = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username
  const limitRaw = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit
  const limit = limitRaw ? Number(limitRaw) : 10

  if (!username) {
    res.status(400).json({ error: 'username is required' })
    return
  }

  const session = createSession()
  const repo = new SocialGraphRepository(session)

  try {
    const result = await repo.friendSuggestions(username, Number.isFinite(limit) ? limit : 10)
    const suggestions = result.records.map((record) => ({
      username: String(record.get('username')),
      connections: Number(record.get('connections'))
    }))

    const payload: SuggestionsResponse = { suggestions }
    res.status(200).json(payload)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch suggestions' })
  } finally {
    await session.close()
  }
}
