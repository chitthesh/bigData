import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { UserRepository } from '../../../repository/UserRepository'
import { parseJsonBody } from '../_utils'

type UsersResponse = {
  users: { username: string }[]
}

type CreateUserBody = {
  username?: string | null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = createSession()
  const repo = new UserRepository(session)

  try {
    if (req.method === 'GET') {
      const result = await repo.getAllUser()
      const users = result.records
        .map((record) => record.get('user'))
        .filter((value) => typeof value === 'string' && value.trim().length > 0)
        .map((value) => ({
          username: value.trim()
        }))

      const payload: UsersResponse = { users }
      res.status(200).json(payload)
      return
    }

    if (req.method === 'POST') {
      const body = parseJsonBody<CreateUserBody>(req)
      const username = body.username ?? null

      if (!username) {
        res.status(400).json({ error: 'username is required' })
        return
      }

      await repo.addUser(username)
      res.status(200).json({ ok: true })
      return
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end('Method Not Allowed')
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Neo4j request failed' })
  } finally {
    await session.close()
  }
}
