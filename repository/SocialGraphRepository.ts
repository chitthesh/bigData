import { Result, Session } from 'neo4j-driver'

class SocialGraphRepository {
  private session: Session

  constructor(sess: Session) {
    this.session = sess
  }

  addFriend(userA: string, userB: string): Result {
    return this.session.run(
      'MATCH (a:User {username: $userA}), (b:User {username: $userB}) WHERE a <> b MERGE (a)-[:FRIEND]-(b) RETURN a.username AS userA, b.username AS userB',
      {
        userA,
        userB
      }
    )
  }

  removeFriend(userA: string, userB: string): Result {
    return this.session.run(
      'MATCH (a:User {username: $userA})-[r:FRIEND]-(b:User {username: $userB}) DELETE r',
      {
        userA,
        userB
      }
    )
  }

  getFriends(username: string): Result {
    return this.session.run(
      'MATCH (u:User {username: $username})-[:FRIEND]-(f:User) RETURN f.username AS username, COUNT { (f)-[:FRIEND]-() } AS connections ORDER BY username',
      {
        username
      }
    )
  }

  mutualFriends(userA: string, userB: string): Result {
    return this.session.run(
      'MATCH (a:User {username: $userA})-[:FRIEND]-(m:User)-[:FRIEND]-(b:User {username: $userB}) WHERE m.username <> $userA AND m.username <> $userB RETURN DISTINCT m.username AS username ORDER BY username',
      {
        userA,
        userB
      }
    )
  }

  friendSuggestions(username: string, limit: number): Result {
    return this.session.run(
      'MATCH (u:User {username: $username})-[:FRIEND]-(f:User)-[:FRIEND]-(s:User) WHERE s.username <> $username AND NOT (u)-[:FRIEND]-(s) RETURN DISTINCT s.username AS username, COUNT { (s)-[:FRIEND]-() } AS connections ORDER BY connections DESC, username LIMIT toInteger($limit)',
      {
        username,
        limit
      }
    )
  }

  shortestPath(userA: string, userB: string, maxDepth: number): Result {
    return this.session.run(
      'MATCH (a:User {username: $userA}), (b:User {username: $userB}), p = shortestPath((a)-[:FRIEND*..6]-(b)) RETURN [n IN nodes(p) | n.username] AS path',
      {
        userA,
        userB,
        maxDepth
      }
    )
  }

  popularUsers(limit: number): Result {
    return this.session.run(
      'MATCH (u:User) RETURN u.username AS username, COUNT { (u)-[:FRIEND]-() } AS connections ORDER BY connections DESC, username LIMIT toInteger($limit)',
      {
        limit
      }
    )
  }

  graphData(): Result {
    return this.session.run(
      'MATCH (u:User) OPTIONAL MATCH (u)-[:FRIEND]-(v:User) RETURN collect(DISTINCT u.username) AS users, collect(DISTINCT {source: u.username, target: v.username}) AS links'
    )
  }
}

export { SocialGraphRepository }
