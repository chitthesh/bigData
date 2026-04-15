export type FeedPost = {
  id: string
  author: string
  caption: string
  imageUrl: string
  createdAt: number
  likes: number
  comments: number
  likedByViewer: boolean
}

export type FollowStats = {
  username: string
  followers: number
  following: number
  posts: number
  isFollowing: boolean
}

export type CommentItem = {
  id: string
  username: string
  text: string
  createdAt: number
  canDelete?: boolean
}

export type PaginatedResponse<T> = {
  page: number
  hasMore: boolean
  items: T[]
}

export type ChatMessage = {
  sender: string
  recipient: string
  body: string
  createdAt: number
}
