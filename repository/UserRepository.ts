import { Result, Session } from "neo4j-driver"

import moment from 'moment';


class UserRepository {
    private session: Session
    constructor(sess: Session) {
        this.session = sess
    }

    getAllUser(): Result {
        return this.session.run('MATCH (f:User) RETURN f.username AS user')
    }

    findUserByUsername(username: string): Result {
        return this.session.run(
            'MATCH (u:User {username: $username}) RETURN u.username AS username, u.passwordHash AS passwordHash, u.passwordSalt AS passwordSalt, u.googleEmail AS googleEmail LIMIT 1',
            { username: username }
        )
    }

    findUserByGoogleEmail(googleEmail: string): Result {
        return this.session.run(
            'MATCH (u:User {googleEmail: $googleEmail}) RETURN u.username AS username LIMIT 1',
            { googleEmail: googleEmail }
        )
    }

    addUserWithPassword(username: string, passwordHash: string, passwordSalt: string): Result {
        return this.session.run(
            'CREATE (u:User {username:$username, user_id:$id, passwordHash:$passwordHash, passwordSalt:$passwordSalt, createdAt:$createdAt}) RETURN u.username AS username',
            {
                username: username,
                id: moment.now(),
                passwordHash: passwordHash,
                passwordSalt: passwordSalt,
                createdAt: moment.now()
            }
        )
    }

    setUserPassword(username: string, passwordHash: string, passwordSalt: string): Result {
        return this.session.run(
            'MATCH (u:User {username: $username}) SET u.passwordHash = $passwordHash, u.passwordSalt = $passwordSalt RETURN u.username AS username',
            {
                username: username,
                passwordHash: passwordHash,
                passwordSalt: passwordSalt
            }
        )
    }

    addGoogleUser(username: string, googleEmail: string, passwordHash: string, passwordSalt: string): Result {
        return this.session.run(
            'CREATE (u:User {username:$username, user_id:$id, googleEmail:$googleEmail, authProvider:"google", passwordHash:$passwordHash, passwordSalt:$passwordSalt, createdAt:$createdAt}) RETURN u.username AS username',
            {
                username: username,
                googleEmail: googleEmail,
                id: moment.now(),
                passwordHash: passwordHash,
                passwordSalt: passwordSalt,
                createdAt: moment.now()
            }
        )
    }

    addUser(username: string | null | undefined): Result {
        return this.session.run('CREATE (a:User {username:$username, user_id:$id})', 
            {
                username: username,
                id: moment.now()
            }
        )
    }

    sosialFollowButton(from: string | null | undefined, to: string | string[] | undefined): Result {
        return this.session.run('MATCH (me:User {username: $from}),(other:User {username: $to}) CALL { WITH me, other MATCH (other)-[:FOLLOW]->(me) RETURN count(other) AS followme } CALL { WITH me, other MATCH (me)-[:FOLLOW]->(other) RETURN count(me) AS followother } RETURN followme, followother', 
        {
            from: from,
            to: to
        }
    )

    }

    follow(from: string | null | undefined, to: string | string[] | undefined): Result {
        return this.session.run(
            'MATCH (a:User {username: $from}),(b:User {username: $to}) MERGE (a)-[:FOLLOW]->(b) WITH a, b, EXISTS((b)-[:FOLLOW]->(a)) AS isMutual FOREACH (_ IN CASE WHEN isMutual THEN [1] ELSE [] END | MERGE (a)-[:MUTUAL]-(b)) RETURN a.username AS from, b.username AS to',
            {
                from: from,
                to: to
            }
        )
    }

    unfollow(from: string | null | undefined, to: string | string[] | undefined): Result {
        return this.session.run(
            'MATCH (a:User {username: $from})-[r:FOLLOW]->(b:User {username: $to}) DELETE r WITH a, b OPTIONAL MATCH (a)-[m:MUTUAL]-(b) DELETE m',
            {
                from: from,
                to: to
            }
        )
    }

    getUserFollower(username: string | string[] | undefined): Result {
        return this.session.run('MATCH (me:User { username: $username})<-[:FOLLOW]-(follower) CALL { WITH me, follower MATCH (me)-[:FOLLOW]->(follower) RETURN count(follower) AS followingback } RETURN follower.username AS follower_username, followingback', 
            {
            username: username
            }
        )

    }

    getProfileFollower(username: string | string[] | undefined, viewer: string | null | undefined): Result {
        return this.session.run('MATCH (prof:User { username: $profile_username})<-[:FOLLOW]-(follower) CALL { WITH prof, follower MATCH (me:User { username: $user})-[:FOLLOW]->(follower) RETURN count(follower) AS following } RETURN follower.username AS follower_username, following', 
            {
                profile_username: username,
                user: viewer
            }
        )

    }

    getProfileFollowing(username: string | string[] | undefined, viewer: string | null | undefined): Result {
        return this.session.run('MATCH (prof:User {username: $profile_username})-[:FOLLOW]->(following) CALL { WITH prof, following MATCH (me:User { username: $user})-[:FOLLOW]->(following) RETURN count(following) AS user_following } RETURN following.username AS following_username, user_following', 
            {
                profile_username: username,
                user: viewer
            }
        )

    }

    getUserFollowing(username: string | string[] | undefined): Result {
        return this.session.run('MATCH ({username: $username})-[:FOLLOW]->(following) RETURN following.username AS following_username', 
            {
            username: username
            }
        )

    }
}



export {UserRepository}