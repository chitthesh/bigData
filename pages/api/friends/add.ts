import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { SocialGraphRepository } from '../../../repository/SocialGraphRepository'
import { parseJsonBody } from '../_utils'

type AddFriendBody = {
  userA?: string | null
  userB?: string | null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const body = parseJsonBody<AddFriendBody>(req)
  const userA = body.userA ?? null
  const userB = body.userB ?? null

  if (!userA || !userB || userA === userB) {
    res.status(400).json({ error: 'userA and userB are required and must be different' })
    return
  }

  const session = createSession()
  const repo = new SocialGraphRepository(session)

  try {
    await repo.addFriend(userA, userB)
    await session.run(
      `MATCH (a:User {username: $userA}), (b:User {username: $userB})
       CREATE (na:Notification {type: 'connection', text: 'You are now connected with @' + $userB, createdAt: timestamp()})
       CREATE (nb:Notification {type: 'connection', text: 'You are now connected with @' + $userA, createdAt: timestamp()})
       CREATE (na)-[:TO]->(a)
       CREATE (nb)-[:TO]->(b)`,
      { userA, userB }
    )
    res.status(200).json({ ok: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to add friend' })
  } finally {
    await session.close()
  }
}
