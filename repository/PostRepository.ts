import { Result, Session } from "neo4j-driver"



class PostRepository {
    private session: Session
    constructor(sess: Session) {
        this.session = sess
    }

    getPosts(): Result {
        return this.session.run('MATCH (u:User)-[r:POSTING]->(p:Post) RETURN p.text AS text, u.username AS username, p.id AS id')
    }

    getComments(post_id: string | number): Result {
        return this.session.run('MATCH ({id: $post_id})<-[r:COMMENT_TO]-(c:Comment)<-[r2:CREATE_COMMENT]-(u:User) RETURN c.text AS text, u.username AS username', 
            {
                post_id: post_id
            }
        )

    }
}



export {PostRepository}