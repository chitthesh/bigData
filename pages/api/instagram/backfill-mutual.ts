import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../../internals/database'

type BackfillResponse = {
  ok: true
  pairsCreated: number
  staleRemoved: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const session = createSession()

  try {
    // Remove stale mutual edges where reciprocal follows no longer exist.
    const staleResult = await session.run(
      `MATCH (a:User)-[m:MUTUAL]-(b:User)
       WHERE NOT (EXISTS((a)-[:FOLLOWS]->(b)) AND EXISTS((b)-[:FOLLOWS]->(a)))
       DELETE m
       RETURN count(m) AS staleRemoved`
    )

    // Backfill mutual edges for users who follow each other.
    const createdResult = await session.run(
      `MATCH (a:User)-[:FOLLOWS]->(b:User)
       MATCH (b)-[:FOLLOWS]->(a)
       WHERE id(a) < id(b)
       MERGE (a)-[m:MUTUAL]-(b)
       RETURN count(m) AS pairsCreated`
    )

    const payload: BackfillResponse = {
      ok: true,
      pairsCreated: Number(createdResult.records[0]?.get('pairsCreated') ?? 0),
      staleRemoved: Number(staleResult.records[0]?.get('staleRemoved') ?? 0)
    }

    res.status(200).json(payload)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to backfill mutual relations' })
  } finally {
    await session.close()
  }
}
