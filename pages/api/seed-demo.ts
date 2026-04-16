import type { NextApiRequest, NextApiResponse } from 'next'

import { createSession } from '../../internals/database'

type SeedResponse = {
  usersCreated: number
  relationshipsCreated: number
  followsCreated: number
  postsCreated: number
  postLikesCreated: number
  postCommentsCreated: number
  interestsCreated: number
  messagesCreated: number
  notificationsCreated: number
}

const USERS = ['alice', 'bob', 'carol', 'dave', 'eve', 'frank']
const RELATIONSHIPS: Array<[string, string]> = [
  ['alice', 'bob'],
  ['alice', 'carol'],
  ['bob', 'dave'],
  ['carol', 'dave'],
  ['dave', 'eve'],
  ['eve', 'frank'],
  ['bob', 'carol']
]

const FOLLOWS: Array<[string, string]> = [
  ['alice', 'bob'],
  ['alice', 'carol'],
  ['bob', 'carol'],
  ['carol', 'dave'],
  ['eve', 'alice'],
  ['frank', 'alice']
]

const POSTS: Array<[string, string, string, string, number]> = [
  ['post_alice_1', 'alice', 'Sunset run by the river.', 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80', 1713139200000],
  ['post_bob_1', 'bob', 'Coffee and code morning.', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80', 1713142800000],
  ['post_carol_1', 'carol', 'Weekend mountain trail.', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80', 1713146400000],
  ['post_dave_1', 'dave', 'Late night city lights.', 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80', 1713150000000]
]

const POST_LIKES: Array<[string, string]> = [
  ['alice', 'post_bob_1'],
  ['carol', 'post_alice_1'],
  ['dave', 'post_alice_1'],
  ['bob', 'post_carol_1'],
  ['eve', 'post_bob_1']
]

const POST_COMMENTS: Array<[string, string, string, number]> = [
  ['bob', 'post_alice_1', 'Looks amazing!', 1713153600000],
  ['alice', 'post_bob_1', 'Great setup!', 1713157200000],
  ['dave', 'post_carol_1', 'Need this hike soon.', 1713160800000]
]

const INTERESTS: Array<[string, string]> = [
  ['alice', 'music'],
  ['alice', 'art'],
  ['bob', 'music'],
  ['bob', 'sports'],
  ['carol', 'art'],
  ['carol', 'travel'],
  ['dave', 'travel'],
  ['dave', 'sports'],
  ['eve', 'photography'],
  ['frank', 'photography']
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end('Method Not Allowed')
    return
  }

  const session = createSession()

  try {
    const usersResult = await session.run(
      `UNWIND $users AS username
       MERGE (:User {username: username})
       RETURN count(*) AS usersCreated`,
      { users: USERS }
    )

    const relResult = await session.run(
      `UNWIND $relationships AS pair
       MATCH (a:User {username: pair[0]}), (b:User {username: pair[1]})
       MERGE (a)-[:FRIEND]-(b)
       RETURN count(*) AS relationshipsCreated`,
      { relationships: RELATIONSHIPS }
    )

    const followsResult = await session.run(
      `UNWIND $follows AS pair
       MATCH (a:User {username: pair[0]}), (b:User {username: pair[1]})
       MERGE (a)-[:FOLLOWS]->(b)
       RETURN count(*) AS followsCreated`,
      { follows: FOLLOWS }
    )

    const postResult = await session.run(
      `UNWIND $posts AS item
       MATCH (u:User {username: item[1]})
       MERGE (p:Post {id: item[0]})
       SET p.caption = item[2], p.imageUrl = item[3], p.visibility = 'followers', p.createdAt = item[4]
       MERGE (u)-[:POSTED]->(p)
       RETURN count(*) AS postsCreated`,
      { posts: POSTS }
    )

    const likesResult = await session.run(
      `UNWIND $likes AS row
       MATCH (u:User {username: row[0]}), (p:Post {id: row[1]})
       MERGE (u)-[:LIKED]->(p)
       RETURN count(*) AS postLikesCreated`,
      { likes: POST_LIKES }
    )

    const commentsResult = await session.run(
      `UNWIND $comments AS row
       MATCH (u:User {username: row[0]}), (p:Post {id: row[1]})
       MERGE (u)-[:COMMENTED {text: row[2], createdAt: row[3]}]->(p)
       RETURN count(*) AS postCommentsCreated`,
      { comments: POST_COMMENTS }
    )

    const interestResult = await session.run(
      `UNWIND $interests AS pair
       MATCH (u:User {username: pair[0]})
       MERGE (i:Interest {name: pair[1]})
       MERGE (u)-[:LIKES]->(i)
       RETURN count(*) AS interestsCreated`,
      { interests: INTERESTS }
    )

    const messageResult = await session.run(
      `MATCH (sender:User {username: 'alice'}), (recipient:User {username: 'bob'}), (recipient2:User {username: 'carol'})
       MERGE (message:Message {body: 'Hey Bob, welcome to the network!', createdAt: 1713164400000})
       MERGE (message2:Message {body: 'Carol, check my new post!', createdAt: 1713168000000})
       MERGE (sender)-[:SENT]->(message)
       MERGE (message)-[:TO]->(recipient)
       MERGE (sender)-[:SENT]->(message2)
       MERGE (message2)-[:TO]->(recipient2)
       RETURN 2 AS messagesCreated`
    )

    const notificationResult = await session.run(
      `MATCH (alice:User {username: 'alice'}), (bob:User {username: 'bob'}), (carol:User {username: 'carol'})
        MERGE (na:Notification {type: 'message', text: 'Welcome message sent to @bob', createdAt: 1713171600000})
        MERGE (nb:Notification {type: 'follow', text: '@alice started following you', createdAt: 1713175200000})
        MERGE (nc:Notification {type: 'like', text: '@carol liked your post', createdAt: 1713178800000})
        MERGE (nd:Notification {type: 'comment', text: '@bob commented on your post', createdAt: 1713182400000})
        MERGE (na)-[:TO]->(alice)
        MERGE (nb)-[:TO]->(bob)
        MERGE (nc)-[:TO]->(alice)
        MERGE (nd)-[:TO]->(alice)
       RETURN 4 AS notificationsCreated`
    )

    const payload: SeedResponse = {
      usersCreated: Number(usersResult.records[0]?.get('usersCreated') ?? USERS.length),
      relationshipsCreated: Number(relResult.records[0]?.get('relationshipsCreated') ?? RELATIONSHIPS.length),
      followsCreated: Number(followsResult.records[0]?.get('followsCreated') ?? FOLLOWS.length),
      postsCreated: Number(postResult.records[0]?.get('postsCreated') ?? POSTS.length),
      postLikesCreated: Number(likesResult.records[0]?.get('postLikesCreated') ?? POST_LIKES.length),
      postCommentsCreated: Number(commentsResult.records[0]?.get('postCommentsCreated') ?? POST_COMMENTS.length),
      interestsCreated: Number(interestResult.records[0]?.get('interestsCreated') ?? INTERESTS.length),
      messagesCreated: Number(messageResult.records[0]?.get('messagesCreated') ?? 2),
      notificationsCreated: Number(notificationResult.records[0]?.get('notificationsCreated') ?? 4)
    }

    res.status(200).json(payload)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to seed demo data' })
  } finally {
    await session.close()
  }
}
