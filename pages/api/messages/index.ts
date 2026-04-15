import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { AdvancedGraphRepository } from '../../../repository/AdvancedGraphRepository'
import { parseJsonBody } from '../_utils'

type MessageItem = {
  sender: string
  recipient: string
  body: string
  createdAt: number
}

type MessagesResponse = {
  messages: MessageItem[]
}

type SendMessageBody = {
  from?: string | null
  to?: string | null
  body?: string | null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = createSession()
  const repo = new AdvancedGraphRepository(session)

  try {
    if (req.method === 'GET') {
      const userA = Array.isArray(req.query.userA) ? req.query.userA[0] : req.query.userA
      const userB = Array.isArray(req.query.userB) ? req.query.userB[0] : req.query.userB

      if (!userA || !userB) {
        res.status(400).json({ error: 'userA and userB are required' })
        return
      }

      const result = await repo.getConversation(userA, userB)
      const payload: MessagesResponse = {
        messages: result.records.map((record) => ({
          sender: String(record.get('sender')),
          recipient: String(record.get('recipient')),
          body: String(record.get('body')),
          createdAt: Number(record.get('createdAt'))
        }))
      }

      res.status(200).json(payload)
      return
    }

    if (req.method === 'POST') {
      const body = parseJsonBody<SendMessageBody>(req)
      const from = body.from?.trim() ?? ''
      const to = body.to?.trim() ?? ''
      const messageBody = body.body?.trim() ?? ''

      if (!from || !to || !messageBody) {
        res.status(400).json({ error: 'from, to, and body are required' })
        return
      }

      await repo.createMessage(from, to, messageBody)
      await repo.createNotification(to, 'message', `New message from @${from}`)
      res.status(200).json({ ok: true })
      return
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end('Method Not Allowed')
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to handle messages' })
  } finally {
    await session.close()
  }
}
