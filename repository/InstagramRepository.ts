import { Result, Session } from 'neo4j-driver'

class InstagramRepository {
  private session: Session

  constructor(sess: Session) {
    this.session = sess
  }

  getUserStats(username: string, viewer?: string): Result {
    return this.session.run(
      `MATCH (u:User {username: $username})
       OPTIONAL MATCH (u)<-[:FOLLOWS]-(follower:User)
       WITH u, count(DISTINCT follower) AS followers
       OPTIONAL MATCH (u)-[:FOLLOWS]->(following:User)
       WITH u, followers, count(DISTINCT following) AS following
       OPTIONAL MATCH (u)-[:POSTED]->(p:Post)
       WITH u, followers, following, count(DISTINCT p) AS posts
       OPTIONAL MATCH (viewer:User {username: $viewer})
       RETURN u.username AS username,
              followers,
              following,
              posts,
              CASE
                WHEN viewer IS NULL THEN false
                ELSE EXISTS((viewer)-[:FOLLOWS]->(u))
              END AS isFollowing`,
      { username, viewer: viewer ?? null }
    )
  }

  follow(from: string, to: string): Result {
    return this.session.run(
      `MATCH (me:User {username: $from}), (other:User {username: $to})
       MERGE (me)-[:FOLLOWS]->(other)
       RETURN me.username AS from, other.username AS to`,
      { from, to }
    )
  }

  unfollow(from: string, to: string): Result {
    return this.session.run(
      `MATCH (me:User {username: $from})-[r:FOLLOWS]->(other:User {username: $to})
       DELETE r`,
      { from, to }
    )
  }

  getFollowers(username: string, limit: number): Result {
    return this.session.run(
      `MATCH (u:User {username: $username})<-[:FOLLOWS]-(follower:User)
       RETURN follower.username AS username
       ORDER BY username ASC
       LIMIT toInteger($limit)`,
      { username, limit }
    )
  }

  getFollowing(username: string, limit: number): Result {
    return this.session.run(
      `MATCH (u:User {username: $username})-[:FOLLOWS]->(following:User)
       RETURN following.username AS username
       ORDER BY username ASC
       LIMIT toInteger($limit)`,
      { username, limit }
    )
  }

  createPost(author: string, id: string, caption: string, imageUrl: string, createdAt: number): Result {
    return this.session.run(
      `MATCH (u:User {username: $author})
       CREATE (p:Post {id: $id, caption: $caption, imageUrl: $imageUrl, createdAt: $createdAt})
       CREATE (u)-[:POSTED]->(p)
       RETURN p.id AS id`,
      { author, id, caption, imageUrl, createdAt }
    )
  }

  getUserPosts(username: string, viewer?: string, limit = 30, skip = 0): Result {
    return this.session.run(
      `MATCH (u:User {username: $username})-[:POSTED]->(post:Post)
       OPTIONAL MATCH (liker:User)-[:LIKED]->(post)
       OPTIONAL MATCH (:User)-[comment:COMMENTED]->(post)
       OPTIONAL MATCH (viewer:User {username: $viewer})
       RETURN post.id AS id,
              post.caption AS caption,
              post.imageUrl AS imageUrl,
              post.createdAt AS createdAt,
              u.username AS author,
              count(DISTINCT liker) AS likes,
              count(comment) AS comments,
              CASE
                WHEN viewer IS NULL THEN false
                ELSE EXISTS((viewer)-[:LIKED]->(post))
              END AS likedByViewer
       ORDER BY post.createdAt DESC
       SKIP toInteger($skip)
       LIMIT toInteger($limit)`,
      { username, viewer: viewer ?? null, limit, skip }
    )
  }

  getFeed(username: string, limit = 30, skip = 0): Result {
    return this.session.run(
      `MATCH (viewer:User {username: $username})
       MATCH (author:User)-[:POSTED]->(post:Post)
       WHERE author = viewer OR EXISTS((viewer)-[:FOLLOWS]->(author))
       OPTIONAL MATCH (liker:User)-[:LIKED]->(post)
       OPTIONAL MATCH (:User)-[comment:COMMENTED]->(post)
       RETURN post.id AS id,
              post.caption AS caption,
              post.imageUrl AS imageUrl,
              post.createdAt AS createdAt,
              author.username AS author,
              count(DISTINCT liker) AS likes,
              count(comment) AS comments,
              EXISTS((viewer)-[:LIKED]->(post)) AS likedByViewer
       ORDER BY post.createdAt DESC
       SKIP toInteger($skip)
       LIMIT toInteger($limit)`,
      { username, limit, skip }
    )
  }

  updatePost(author: string, postId: string, caption: string, imageUrl: string): Result {
    return this.session.run(
      `MATCH (u:User {username: $author})-[:POSTED]->(post:Post {id: $postId})
       SET post.caption = $caption,
           post.imageUrl = $imageUrl
       RETURN post.id AS id`,
      { author, postId, caption, imageUrl }
    )
  }

  deletePost(author: string, postId: string): Result {
    return this.session.run(
      `MATCH (u:User {username: $author})-[:POSTED]->(post:Post {id: $postId})
       DETACH DELETE post`,
      { author, postId }
    )
  }

  likePost(username: string, postId: string): Result {
    return this.session.run(
      `MATCH (u:User {username: $username}), (post:Post {id: $postId})
       MERGE (u)-[:LIKED]->(post)
       RETURN post.id AS postId`,
      { username, postId }
    )
  }

  unlikePost(username: string, postId: string): Result {
    return this.session.run(
      `MATCH (u:User {username: $username})-[r:LIKED]->(post:Post {id: $postId})
       DELETE r`,
      { username, postId }
    )
  }

  getPostAuthor(postId: string): Result {
    return this.session.run(
      `MATCH (author:User)-[:POSTED]->(post:Post {id: $postId})
       RETURN author.username AS username
       LIMIT 1`,
      { postId }
    )
  }

  addComment(username: string, postId: string, commentId: string, text: string, createdAt: number): Result {
    return this.session.run(
      `MATCH (u:User {username: $username}), (post:Post {id: $postId})
       CREATE (u)-[:COMMENTED {id: $commentId, text: $text, createdAt: $createdAt}]->(post)
       RETURN post.id AS postId`,
      { username, postId, commentId, text, createdAt }
    )
  }

  deleteComment(username: string, postId: string, commentId: string): Result {
    return this.session.run(
      `MATCH (u:User {username: $username})-[c:COMMENTED {id: $commentId}]->(post:Post {id: $postId})
       DELETE c`,
      { username, postId, commentId }
    )
  }

  deleteCommentByFingerprint(username: string, postId: string, createdAt: number, text: string): Result {
    return this.session.run(
      `MATCH (u:User {username: $username})-[c:COMMENTED {createdAt: $createdAt, text: $text}]->(post:Post {id: $postId})
       DELETE c`,
      { username, postId, createdAt, text }
    )
  }

  getComments(postId: string, limit = 25, skip = 0): Result {
    return this.session.run(
      `MATCH (u:User)-[c:COMMENTED]->(post:Post {id: $postId})
       RETURN c.id AS id, u.username AS username, c.text AS text, c.createdAt AS createdAt
       ORDER BY c.createdAt DESC
       SKIP toInteger($skip)
       LIMIT toInteger($limit)`,
      { postId, limit, skip }
    )
  }

  createMessage(from: string, to: string, body: string, createdAt: number): Result {
    return this.session.run(
      `MATCH (sender:User {username: $from}), (recipient:User {username: $to})
       CREATE (message:Message {body: $body, createdAt: $createdAt})
       CREATE (sender)-[:SENT]->(message)-[:TO]->(recipient)
       RETURN message.createdAt AS createdAt`,
      { from, to, body, createdAt }
    )
  }

  getConversation(userA: string, userB: string): Result {
    return this.session.run(
      `MATCH (a:User {username: $userA}), (b:User {username: $userB})
       MATCH (sender:User)-[:SENT]->(message:Message)-[:TO]->(recipient:User)
       WHERE (sender = a AND recipient = b) OR (sender = b AND recipient = a)
       RETURN sender.username AS sender,
              recipient.username AS recipient,
              message.body AS body,
              message.createdAt AS createdAt
       ORDER BY createdAt ASC`,
      { userA, userB }
    )
  }

  createNotification(username: string, type: string, text: string, createdAt: number): Result {
    return this.session.run(
      `MATCH (u:User {username: $username})
       CREATE (n:Notification {type: $type, text: $text, createdAt: $createdAt})
       CREATE (n)-[:TO]->(u)
       RETURN n.type AS type`,
      { username, type, text, createdAt }
    )
  }
}

export { InstagramRepository }
