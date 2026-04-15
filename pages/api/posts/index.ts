import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { PostRepository } from '../../../repository/PostRepository'

type PostsResponse = {
  posts: { text: string; username: string; id: string }[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const session = createSession()
  const repo = new PostRepository(session)

  try {
    const result = await repo.getPosts()
    const posts = result.records.map((record) => ({
      text: String(record.get('text')),
      username: String(record.get('username')),
      id: String(record.get('id'))
    }))

    const payload: PostsResponse = { posts }
    res.status(200).json(payload)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Neo4j request failed' })
  } finally {
    await session.close()
  }
}
