import { randomBytes } from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'

import { createPasswordSalt, hashPassword } from '../../../internals/auth'
import { createSession } from '../../../internals/database'
import { UserRepository } from '../../../repository/UserRepository'
import { parseJsonBody } from '../_utils'

type GoogleBody = {
  email?: string | null
}

function usernameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? ''
  const normalized = localPart.toLowerCase().replace(/[^a-z0-9_.]/g, '')
  const compact = normalized.slice(0, 20)

  if (compact.length >= 3) {
    return compact
  }

  return `user${Math.floor(Date.now() % 100000)}`
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
    const body = parseJsonBody<GoogleBody>(req)
    const email = (body.email ?? '').trim().toLowerCase()

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'valid email is required' })
      return
    }

    const existingGoogle = await repo.findUserByGoogleEmail(email)
    if (existingGoogle.records.length > 0) {
      const username = String(existingGoogle.records[0].get('username') ?? '')
      res.status(200).json({ ok: true, username })
      return
    }

    const baseUsername = usernameFromEmail(email)
    let selectedUsername = baseUsername

    for (let attempt = 0; attempt < 50; attempt += 1) {
      const candidate = attempt === 0 ? baseUsername : `${baseUsername.slice(0, 16)}${attempt}`
      const check = await repo.findUserByUsername(candidate)

      if (!check.records.length) {
        selectedUsername = candidate
        break
      }

      const existingEmail = String(check.records[0].get('googleEmail') ?? '')
      if (existingEmail === email) {
        selectedUsername = candidate
        break
      }
    }

    const randomPassword = randomBytes(24).toString('hex')
    const salt = createPasswordSalt()
    const passwordHash = hashPassword(randomPassword, salt)
    await repo.addGoogleUser(selectedUsername, email, passwordHash, salt)

    res.status(200).json({ ok: true, username: selectedUsername })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to continue with Google' })
  } finally {
    await session.close()
  }
}
