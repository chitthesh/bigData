import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { AdvancedGraphRepository } from '../../../repository/AdvancedGraphRepository'
import { parseJsonBody } from '../_utils'

type InterestsResponse = {
  interests: string[]
}

type AddInterestBody = {
  username?: string | null
  interest?: string | null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = createSession()
  const repo = new AdvancedGraphRepository(session)

  try {
    if (req.method === 'GET') {
      const username = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username
      if (!username) {
        res.status(400).json({ error: 'username is required' })
        return
      }

      const result = await session.run(
        'MATCH (u:User {username: $username})-[:LIKES]->(i:Interest) RETURN DISTINCT i.name AS interest ORDER BY interest',
        { username }
      )

      const payload: InterestsResponse = {
        interests: result.records.map((record) => String(record.get('interest'))).filter(Boolean)
      }
      res.status(200).json(payload)
      return
    }

    if (req.method === 'POST') {
      const body = parseJsonBody<AddInterestBody>(req)
      const username = body.username ?? null
      const interest = body.interest?.trim() ?? ''

      if (!username || !interest) {
        res.status(400).json({ error: 'username and interest are required' })
        return
      }

      await repo.addInterestLike(username, interest)
      res.status(200).json({ ok: true })
      return
    }

    if (req.method === 'DELETE') {
      const body = parseJsonBody<AddInterestBody>(req)
      const username = body.username ?? null
      const interest = body.interest?.trim() ?? ''

      if (!username || !interest) {
        res.status(400).json({ error: 'username and interest are required' })
        return
      }

      await repo.removeInterestLike(username, interest)
      res.status(200).json({ ok: true })
      return
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    res.status(405).end('Method Not Allowed')
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to manage interests' })
  } finally {
    await session.close()
  }
}
