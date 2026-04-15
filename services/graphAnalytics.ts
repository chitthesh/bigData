export type GraphEdge = {
  source: string
  target: string
}

export type UserInterest = {
  username: string
  interest: string
}

export type Community = {
  id: number
  members: string[]
}

export type Recommendation = {
  username: string
  score: number
  mutualFriends: number
  sharedInterests: number
}

function buildUndirectedAdjacency(users: string[], edges: GraphEdge[]) {
  const adjacency = new Map<string, Set<string>>()

  for (const user of users) {
    adjacency.set(user, new Set())
  }

  for (const edge of edges) {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, new Set())
    }
    if (!adjacency.has(edge.target)) {
      adjacency.set(edge.target, new Set())
    }

    adjacency.get(edge.source)?.add(edge.target)
    adjacency.get(edge.target)?.add(edge.source)
  }

  return adjacency
}

function computeCommunities(users: string[], edges: GraphEdge[]): Community[] {
  const adjacency = buildUndirectedAdjacency(users, edges)
  const visited = new Set<string>()
  const communities: Community[] = []
  let communityId = 1

  for (const user of users) {
    if (visited.has(user)) {
      continue
    }

    const stack = [user]
    const members: string[] = []
    visited.add(user)

    while (stack.length) {
      const current = stack.pop()
      if (!current) {
        continue
      }

      members.push(current)
      const neighbors = adjacency.get(current) ?? new Set<string>()
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          stack.push(neighbor)
        }
      }
    }

    communities.push({ id: communityId++, members: members.sort() })
  }

  return communities
}

function computeDegreeCentrality(users: string[], edges: GraphEdge[]) {
  const adjacency = buildUndirectedAdjacency(users, edges)

  return [...adjacency.entries()]
    .map(([username, neighbors]) => ({
      username,
      connections: neighbors.size,
      score: users.length > 1 ? neighbors.size / (users.length - 1) : 0
    }))
    .sort((left, right) => right.connections - left.connections || left.username.localeCompare(right.username))
}

function computeInterestRecommendations(
  currentUser: string,
  users: string[],
  edges: GraphEdge[],
  interests: UserInterest[]
): Recommendation[] {
  const adjacency = buildUndirectedAdjacency(users, edges)
  const currentFriends = adjacency.get(currentUser) ?? new Set<string>()
  const currentInterests = new Set(
    interests.filter((item) => item.username === currentUser).map((item) => item.interest)
  )

  const byUser = new Map<string, Set<string>>()
  for (const item of interests) {
    if (!byUser.has(item.username)) {
      byUser.set(item.username, new Set())
    }
    byUser.get(item.username)?.add(item.interest)
  }

  return users
    .filter((candidate) => candidate !== currentUser && !currentFriends.has(candidate))
    .map((candidate) => {
      const candidateFriends = adjacency.get(candidate) ?? new Set<string>()
      let mutualFriends = 0
      for (const friend of currentFriends) {
        if (candidateFriends.has(friend)) {
          mutualFriends += 1
        }
      }

      const candidateInterests = byUser.get(candidate) ?? new Set<string>()
      let sharedInterests = 0
      for (const interest of candidateInterests) {
        if (currentInterests.has(interest)) {
          sharedInterests += 1
        }
      }

      return {
        username: candidate,
        mutualFriends,
        sharedInterests,
        score: mutualFriends * 2 + sharedInterests * 3
      }
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || right.mutualFriends - left.mutualFriends || left.username.localeCompare(right.username))
}

export {
  computeCommunities,
  computeDegreeCentrality,
  computeInterestRecommendations
}
