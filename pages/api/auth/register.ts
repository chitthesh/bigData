import type { NextApiRequest, NextApiResponse } from 'next'

import { createPasswordSalt, hashPassword } from '../../../internals/auth'
import { createSession } from '../../../internals/database'
import { UserRepository } from '../../../repository/UserRepository'
import { parseJsonBody } from '../_utils'

type RegisterBody = {
  username?: string | null
  password?: string | null
}

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const session = createSession()
  const repo = new UserRepository(session)

  try {
    const body = parseJsonBody<RegisterBody>(req)
    const username = normalizeUsername(body.username ?? '')
    const password = (body.password ?? '').trim()

    if (!username || !password) {
      res.status(400).json({ error: 'username and password are required' })
      return
    }

    if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
      res.status(400).json({ error: 'username must be 3-20 chars and contain only letters, numbers, underscore, or dot' })
      return
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'password must be at least 6 characters' })
      return
    }

    const existingResult = await repo.findUserByUsername(username)
    if (existingResult.records.length > 0) {
      res.status(409).json({ error: 'username is already taken' })
      return
    }

    const salt = createPasswordSalt()
    const passwordHash = hashPassword(password, salt)
    await repo.addUserWithPassword(username, passwordHash, salt)

    res.status(200).json({ ok: true, username })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to register user' })
  } finally {
    await session.close()
  }
}
