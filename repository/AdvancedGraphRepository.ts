import { Result, Session } from 'neo4j-driver'

class AdvancedGraphRepository {
  private session: Session

  constructor(sess: Session) {
    this.session = sess
  }

  getAllUsers(): Result {
    return this.session.run(
      'MATCH (u:User) RETURN DISTINCT u.username AS username ORDER BY username'
    )
  }

  getFriendEdges(): Result {
    return this.session.run(
      'MATCH (a:User)-[:FRIEND]-(b:User) WHERE a.username < b.username RETURN DISTINCT a.username AS source, b.username AS target'
    )
  }

  getLikes(): Result {
    return this.session.run(
      'MATCH (u:User)-[:LIKES]->(i:Interest) RETURN u.username AS username, i.name AS interest ORDER BY username, interest'
    )
  }

  getInterestNames(): Result {
    return this.session.run(
      'MATCH (i:Interest) RETURN DISTINCT i.name AS name ORDER BY name'
    )
  }

  addInterestLike(username: string, interest: string): Result {
    return this.session.run(
      'MATCH (u:User {username: $username}) MERGE (i:Interest {name: $interest}) MERGE (u)-[:LIKES]->(i) RETURN u.username AS username, i.name AS interest',
      { username, interest }
    )
  }

  removeInterestLike(username: string, interest: string): Result {
    return this.session.run(
      'MATCH (u:User {username: $username})-[r:LIKES]->(i:Interest {name: $interest}) DELETE r',
      { username, interest }
    )
  }

  createMessage(from: string, to: string, body: string): Result {
    return this.session.run(
      `MATCH (sender:User {username: $from}), (recipient:User {username: $to})
       CREATE (message:Message {body: $body, createdAt: timestamp()})
       CREATE (sender)-[:SENT]->(message)-[:TO]->(recipient)
       RETURN message.body AS body, message.createdAt AS createdAt, sender.username AS sender, recipient.username AS recipient`,
      { from, to, body }
    )
  }

  getConversation(userA: string, userB: string): Result {
    return this.session.run(
      `MATCH (a:User {username: $userA}), (b:User {username: $userB})
       MATCH (sender:User)-[:SENT]->(message:Message)-[:TO]->(recipient:User)
       WHERE (sender = a AND recipient = b) OR (sender = b AND recipient = a)
       RETURN sender.username AS sender, recipient.username AS recipient, message.body AS body, message.createdAt AS createdAt
       ORDER BY createdAt ASC`,
      { userA, userB }
    )
  }

  getNotifications(username: string, limit: number): Result {
    return this.session.run(
      `MATCH (u:User {username: $username})<-[:TO]-(n:Notification)
       RETURN n.type AS type, n.text AS text, n.createdAt AS createdAt
       ORDER BY createdAt DESC
       LIMIT toInteger($limit)`,
      { username, limit }
    )
  }

  createNotification(username: string, type: string, text: string): Result {
    return this.session.run(
      `MATCH (u:User {username: $username})
       CREATE (n:Notification {type: $type, text: $text, createdAt: timestamp()})
       CREATE (n)-[:TO]->(u)
       RETURN n.type AS type, n.text AS text`,
      { username, type, text }
    )
  }

  totalUsers(): Result {
    return this.session.run('MATCH (u:User) RETURN count(u) AS totalUsers')
  }

  totalConnections(): Result {
    return this.session.run(
      'MATCH ()-[r:FRIEND]-() WITH count(DISTINCT r) AS relationships RETURN relationships AS totalConnections'
    )
  }
}

export { AdvancedGraphRepository }
