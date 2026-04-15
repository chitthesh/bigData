import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useMemo, useState } from 'react'

import { EmptyState } from '../../components/EmptyState'
import { useUserContext } from '../../components/UserContext'
import type { FeedPost, FollowStats } from '../../types/instagram'

const ProfilePage: NextPage = () => {
  const router = useRouter()
  const { currentUser } = useUserContext()
  const username = useMemo(
    () => (Array.isArray(router.query.username) ? router.query.username[0] : router.query.username) ?? '',
    [router.query.username]
  )

  const [stats, setStats] = useState<FollowStats | null>(null)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [followers, setFollowers] = useState<string[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')

  const isOwnProfile = !!currentUser && currentUser === username

  async function loadProfileData() {
    if (!username) {
      return
    }

    setLoading(true)

    const statsResponse = await fetch(
      `/api/instagram/follows?username=${encodeURIComponent(username)}&viewer=${encodeURIComponent(currentUser ?? '')}`
    )
    const postsResponse = await fetch(
      `/api/instagram/posts?username=${encodeURIComponent(username)}&viewer=${encodeURIComponent(currentUser ?? '')}&limit=30`
    )
    const followersResponse = await fetch(`/api/instagram/follows?username=${encodeURIComponent(username)}&list=followers&limit=10`)
    const followingResponse = await fetch(`/api/instagram/follows?username=${encodeURIComponent(username)}&list=following&limit=10`)

    if (!statsResponse.ok || !postsResponse.ok || !followersResponse.ok || !followingResponse.ok) {
      setLoading(false)
      throw new Error('Failed to load profile')
    }

    const statsData = await statsResponse.json()
    const postsData = await postsResponse.json()
    const followersData = await followersResponse.json()
    const followingData = await followingResponse.json()

    setStats({
      username,
      followers: Number(statsData.followers ?? 0),
      following: Number(statsData.following ?? 0),
      posts: Number(statsData.posts ?? 0),
      isFollowing: Boolean(statsData.isFollowing ?? false)
    })
    setPosts(Array.isArray(postsData.posts) ? postsData.posts : [])
    setFollowers(Array.isArray(followersData.users) ? followersData.users.map((item: { username: string }) => item.username) : [])
    setFollowing(Array.isArray(followingData.users) ? followingData.users.map((item: { username: string }) => item.username) : [])
    setLoading(false)
  }

  async function onFollowToggle() {
    if (!currentUser || !stats || currentUser === username) {
      return
    }

    const response = await fetch('/api/instagram/follows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: currentUser,
        to: username,
        action: stats.isFollowing ? 'unfollow' : 'follow'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to update follow state')
    }

    await loadProfileData()
  }

  function openEditModal(post: FeedPost) {
    setEditingPost(post)
    setEditCaption(post.caption)
    setEditImageUrl(post.imageUrl)
  }

  function closeEditModal() {
    setEditingPost(null)
    setEditCaption('')
    setEditImageUrl('')
  }

  async function submitPostEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentUser || !editingPost || !editImageUrl.trim()) {
      return
    }

    const response = await fetch('/api/instagram/posts', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        author: currentUser,
        postId: editingPost.id,
        caption: editCaption,
        imageUrl: editImageUrl.trim()
      })
    })

    if (!response.ok) {
      throw new Error('Failed to update post')
    }

    closeEditModal()
    await loadProfileData()
  }

  async function deletePostFromModal() {
    if (!currentUser || !editingPost) {
      return
    }

    const ok = confirm('Delete this post permanently?')
    if (!ok) {
      return
    }

    const response = await fetch('/api/instagram/posts', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ author: currentUser, postId: editingPost.id })
    })

    if (!response.ok) {
      throw new Error('Failed to delete post')
    }

    closeEditModal()
    await loadProfileData()
  }

  useEffect(() => {
    loadProfileData().catch((error) => console.error(error))
  }, [username, currentUser])

  if (!username) {
    return <EmptyState title="Profile not found" message="Provide a valid username in the route." />
  }

  return (
    <div className="space-y-6">
      <Head>
        <title>Profile @{username}</title>
      </Head>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-fuchsia-500 via-rose-500 to-orange-400 p-6 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-white/80">Profile</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white">
                {username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-white">@{username}</h1>
                <p className="mt-1 text-sm text-white/85">Personal profile and posts.</p>
              </div>
            </div>

            {currentUser && currentUser !== username ? (
              <button
                onClick={() => onFollowToggle().catch((error) => console.error(error))}
                className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition ${
                  stats?.isFollowing ? 'bg-slate-800 hover:bg-slate-900' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {stats?.isFollowing ? 'Following' : 'Follow'}
              </button>
            ) : null}
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:shadow-sm">
              <p className="text-2xl font-semibold text-slate-900">{stats?.posts ?? 0}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Posts</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:shadow-sm">
              <p className="text-2xl font-semibold text-slate-900">{stats?.followers ?? 0}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Followers</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:shadow-sm">
              <p className="text-2xl font-semibold text-slate-900">{stats?.following ?? 0}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Following</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Followers</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {followers.length ? (
              followers.map((name) => (
                <button
                  key={name}
                  onClick={() => router.push(`/profile/${encodeURIComponent(name)}`)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  @{name}
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-500">No followers yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Following</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {following.length ? (
              following.map((name) => (
                <button
                  key={name}
                  onClick={() => router.push(`/profile/${encodeURIComponent(name)}`)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  @{name}
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-500">Not following anyone yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Posts</h2>
        {loading ? <EmptyState title="Loading posts" message="Fetching user posts from Neo4j." /> : null}
        {!loading && !posts.length ? <EmptyState title="No posts yet" message="This user has not posted yet." /> : null}
        {!!posts.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {posts.map((post) => (
              <div key={post.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <img src={post.imageUrl} alt={post.caption || post.id} className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.03] md:h-52" />
                <div className="space-y-2 px-3 py-2">
                  <p className="line-clamp-2 text-xs text-slate-700">{post.caption || 'No caption'}</p>
                  <div className="flex flex-wrap gap-1">
                    <span className="rounded-full bg-fuchsia-50 px-2 py-0.5 text-[11px] font-semibold text-fuchsia-700">{post.likes} likes</span>
                    <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">{post.comments} comments</span>
                  </div>
                  {isOwnProfile ? (
                    <button
                      onClick={() => openEditModal(post)}
                      className="mt-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      Edit Post
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {editingPost ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Edit Post</h3>
              <button onClick={closeEditModal} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200">
                Close
              </button>
            </div>

            <form onSubmit={(event) => submitPostEdit(event).catch((error) => console.error(error))} className="space-y-3">
              <input
                value={editImageUrl}
                onChange={(event) => setEditImageUrl(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="Image URL"
                required
              />
              <textarea
                value={editCaption}
                onChange={(event) => setEditCaption(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="Caption"
              />

              {editImageUrl ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img src={editImageUrl} alt="Edit preview" className="max-h-72 w-full object-cover" />
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => deletePostFromModal().catch((error) => console.error(error))}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Delete Post
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ProfilePage
