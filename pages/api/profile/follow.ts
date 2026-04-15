import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { UserRepository } from '../../../repository/UserRepository'
import { parseJsonBody } from '../_utils'

type FollowBody = {
  from?: string | null
  to?: string | null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const body = parseJsonBody<FollowBody>(req)
  const from = body.from ?? null
  const to = body.to ?? null

  if (!from || !to) {
    res.status(400).json({ error: 'from and to are required' })
    return
  }

  const session = createSession()
  const repo = new UserRepository(session)

  try {
    await repo.follow(from, to)
    res.status(200).json({ ok: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Neo4j request failed' })
  } finally {
    await session.close()
  }
}
