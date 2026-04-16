import type { NextApiRequest, NextApiResponse } from 'next'

import { createPasswordSalt, hashPassword, verifyPassword } from '../../../internals/auth'
import { createSession } from '../../../internals/database'
import { UserRepository } from '../../../repository/UserRepository'
import { parseJsonBody } from '../_utils'

type LoginBody = {
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
    const body = parseJsonBody<LoginBody>(req)
    const username = normalizeUsername(body.username ?? '')
    const password = (body.password ?? '').trim()

    if (!username || !password) {
      res.status(400).json({ error: 'username and password are required' })
      return
    }

    const result = await repo.findUserByUsername(username)
    if (!result.records.length) {
      res.status(401).json({ error: 'invalid username or password' })
      return
    }

    const record = result.records[0]
    const passwordHash = String(record.get('passwordHash') ?? '')
    const passwordSalt = String(record.get('passwordSalt') ?? '')

    if (!passwordHash || !passwordSalt) {
      const canUseLegacyDefault = password === username
      if (!canUseLegacyDefault) {
        res.status(401).json({ error: 'invalid username or password' })
        return
      }

      const newSalt = createPasswordSalt()
      const newHash = hashPassword(password, newSalt)
      await repo.setUserPassword(username, newHash, newSalt)
      res.status(200).json({ ok: true, username })
      return
    }

    const valid = verifyPassword(password, passwordSalt, passwordHash)
    if (!valid) {
      res.status(401).json({ error: 'invalid username or password' })
      return
    }

    res.status(200).json({ ok: true, username })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to login' })
  } finally {
    await session.close()
  }
}
