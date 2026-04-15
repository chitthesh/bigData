import { auth, driver, Session } from 'neo4j-driver'

const DEFAULT_NEO4J_URI = 'bolt://127.0.0.1:7687'
const DEFAULT_NEO4J_USERNAME = 'neo4j'
const DEFAULT_NEO4J_PASSWORD = 'neo4j'

function createSession(): Session {
    const drv = driver(
        process.env.NEO4J_URI ?? DEFAULT_NEO4J_URI,
        auth.basic(
            process.env.NEO4J_USER ?? DEFAULT_NEO4J_USERNAME,
            process.env.NEO4J_PASSWORD ?? DEFAULT_NEO4J_PASSWORD
        )
    )

    return drv.session()
}

export { createSession }
