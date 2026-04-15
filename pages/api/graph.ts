import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../internals/database'
import { SocialGraphRepository } from '../../repository/SocialGraphRepository'

type GraphResponse = {
  nodes: { id: string }[]
  links: { source: string; target: string }[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const session = createSession()
  const repo = new SocialGraphRepository(session)

  try {
    const result = await repo.graphData()
    const record = result.records[0]
    const users = record ? (record.get('users') as string[]) : []
    const links = record ? (record.get('links') as { source: string; target: string }[]) : []

    const payload: GraphResponse = {
      nodes: users.filter(Boolean).map((user) => ({ id: String(user) })),
      links: links.filter((link) => link && link.source && link.target)
    }

    res.status(200).json(payload)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch graph data' })
  } finally {
    await session.close()
  }
}
