import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { EmptyState } from '../components/EmptyState'
import { PostCard } from '../components/PostCard'
import { StoriesStrip } from '../components/StoriesStrip'
import { useUserContext } from '../components/UserContext'
import type { FeedPost } from '../types/instagram'

const Home: NextPage = () => {
  const { currentUser } = useUserContext()
  const [feed, setFeed] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const fetchingMoreRef = useRef(false)

  async function loadFeed(pageToLoad = 1, append = false) {
    if (!currentUser) {
      setFeed([])
      setPage(1)
      setHasMore(false)
      return
    }

    setLoading(true)
    const response = await fetch(
      `/api/instagram/feed?username=${encodeURIComponent(currentUser)}&limit=10&page=${pageToLoad}`
    )
    if (!response.ok) {
      setLoading(false)
      throw new Error('Failed to load feed')
    }

    const data = await response.json()
    const posts = Array.isArray(data.posts) ? data.posts : []
    setFeed((previous) => (append ? [...previous, ...posts] : posts))
    setPage(pageToLoad)
    setHasMore(Boolean(data.hasMore))
    setLoading(false)
  }

  useEffect(() => {
    loadFeed(1, false).catch((error) => console.error(error))
  }, [currentUser])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (!first?.isIntersecting || loading || fetchingMoreRef.current) {
          return
        }

        fetchingMoreRef.current = true
        loadFeed(page + 1, true)
          .catch((error) => console.error(error))
          .finally(() => {
            fetchingMoreRef.current = false
          })
      },
      { threshold: 0.2 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loading, page, currentUser])

  return (
    <div className="space-y-4">
      <Head>
        <title>Home Feed</title>
        <meta name="description" content="Instagram-style social feed powered by Neo4j." />
      </Head>

      {!currentUser ? (
        <EmptyState
          title="Select an active user"
          message="Pick an active user from the top bar to load their personalized feed."
        />
      ) : (
        <>
          <div className="flex justify-end">
            <Link href="/create-post" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              Create new post
            </Link>
          </div>

          <StoriesStrip />

          <section className="mx-auto max-w-2xl space-y-5">
            {loading ? <EmptyState title="Loading feed" message="Fetching recent posts from users you follow..." /> : null}
            {!loading && !feed.length ? (
              <EmptyState
                title="No posts in your feed"
                message="Follow other users and create posts to populate your home feed."
              />
            ) : null}

            {feed.map((post) => (
              <PostCard key={post.id} post={post} onRefresh={() => loadFeed(1, false)} />
            ))}

            {hasMore ? (
              <div ref={sentinelRef} className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-center text-sm text-slate-500">
                {loading ? 'Loading more posts...' : 'Scroll for more posts'}
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  )
}

export default Home
