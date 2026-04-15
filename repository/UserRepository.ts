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
        return this.session.run('MATCH (a:User {username: $from}),(b:User {username: $to}) WITH a, b CREATE (a)-[r:FOLLOW]->(b)', 
            {
            from: from,
            to: to
            }
        )
    }

    unfollow(from: string | null | undefined, to: string | string[] | undefined): Result {
        return this.session.run('MATCH ({username: $from})-[r:FOLLOW]->({username: $to}) DELETE r', 
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