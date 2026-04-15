import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'
import { PostRepository } from '../../../repository/PostRepository'

type CommentsResponse = {
  comments: { text: string; username: string }[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const postId = req.query.postId
  const postIdValue = Array.isArray(postId) ? postId[0] : postId

  if (!postIdValue) {
    res.status(400).json({ error: 'postId is required' })
    return
  }

  const session = createSession()
  const repo = new PostRepository(session)

  try {
    const result = await repo.getComments(postIdValue)
    const comments = result.records.map((record) => ({
      text: String(record.get('text')),
      username: String(record.get('username'))
    }))

    const payload: CommentsResponse = { comments }
    res.status(200).json(payload)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Neo4j request failed' })
  } finally {
    await session.close()
  }
}
