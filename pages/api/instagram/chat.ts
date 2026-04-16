import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { InstagramRepository } from '../../../repository/InstagramRepository'
import { parseJsonBody } from '../_utils'

type SendMessageBody = {
  from?: string
  to?: string
  body?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = createSession()
  const repo = new InstagramRepository(session)

  try {
    if (req.method === 'GET') {
      const username = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username
      const mode = Array.isArray(req.query.mode) ? req.query.mode[0] : req.query.mode
      const search = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search
      const limit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit

      if (mode === 'threads') {
        if (!username) {
          res.status(400).json({ error: 'username is required for thread list' })
          return
        }

        const maxThreads = Number(limit ?? 30)
        const result = await repo.getChatThreads(username, search?.trim() ?? '', Number.isFinite(maxThreads) ? maxThreads : 30)
        const threads = result.records.map((record) => ({
          username: String(record.get('username')),
          body: String(record.get('body') ?? ''),
          createdAt: Number(record.get('createdAt') ?? 0),
          sentByMe: Boolean(record.get('sentByMe') ?? false)
        }))

        res.status(200).json({ threads })
        return
      }

      const userA = Array.isArray(req.query.userA) ? req.query.userA[0] : req.query.userA
      const userB = Array.isArray(req.query.userB) ? req.query.userB[0] : req.query.userB

      if (!userA || !userB) {
        res.status(400).json({ error: 'userA and userB are required' })
        return
      }

      const result = await repo.getConversation(userA, userB)
      const messages = result.records.map((record) => ({
        sender: String(record.get('sender')),
        recipient: String(record.get('recipient')),
        body: String(record.get('body')),
        createdAt: Number(record.get('createdAt'))
      }))

      res.status(200).json({ messages })
      return
    }

    if (req.method === 'POST') {
      const body = parseJsonBody<SendMessageBody>(req)
      const from = body.from?.trim() ?? ''
      const to = body.to?.trim() ?? ''
      const messageBody = body.body?.trim() ?? ''

      if (!from || !to || !messageBody) {
        res.status(400).json({ error: 'from, to and body are required' })
        return
      }

      await repo.createMessage(from, to, messageBody, Date.now())
      await repo.createNotification(to, 'message', `@${from} sent you a message`, Date.now())

      res.status(200).json({ ok: true })
      return
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end('Method Not Allowed')
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to handle chat' })
  } finally {
    await session.close()
  }
}
