import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '../../../components/EmptyState'
import { useUserContext } from '../../../components/UserContext'

type SectionKey = 'followers' | 'following' | 'mutual'

type SectionUser = {
  username: string
}

function getSectionLabel(section: SectionKey): string {
  if (section === 'followers') {
    return 'Followers'
  }

  if (section === 'following') {
    return 'Following'
  }

  return 'Mutual follows'
}

const ProfileSectionPage: NextPage = () => {
  const router = useRouter()
  const { currentUser } = useUserContext()
  const username = useMemo(
    () => (Array.isArray(router.query.username) ? router.query.username[0] : router.query.username) ?? '',
    [router.query.username]
  )
  const section = useMemo(() => {
    const value = Array.isArray(router.query.section) ? router.query.section[0] : router.query.section
    if (value === 'followers' || value === 'following' || value === 'mutual') {
      return value
    }

    return ''
  }, [router.query.section])

  const [users, setUsers] = useState<SectionUser[]>([])
  const [loading, setLoading] = useState(false)

  const label = section ? getSectionLabel(section) : 'Users'
  const isMutual = section === 'mutual'
  const visibleUsers = users.filter((user) => user.username !== currentUser)

  function orderUsers(items: SectionUser[]) {
    return [...items].sort((left, right) => {
      if (currentUser) {
        if (left.username === currentUser && right.username !== currentUser) {
          return -1
        }

        if (right.username === currentUser && left.username !== currentUser) {
          return 1
        }
      }

      return left.username.localeCompare(right.username)
    })
  }

  async function loadUsers() {
    if (!username || !section) {
      return
    }

    if (isMutual && !currentUser) {
      setUsers([])
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({ username, list: section, limit: '50' })
      if (isMutual) {
        params.set('viewer', currentUser ?? '')
      }

      const response = await fetch(`/api/instagram/follows?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load users')
      }

      const data = await response.json()
      setUsers(orderUsers(Array.isArray(data.users) ? data.users : []))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers().catch((error) => console.error(error))
  }, [username, section, currentUser])

  if (!username || !section) {
    return <EmptyState title="Page not found" message="Choose a valid profile list to continue." />
  }

  return (
    <div className="space-y-5">
      <Head>
        <title>{label} of @{username}</title>
      </Head>

      <section className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Profile</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{label}</h1>
          <p className="text-sm text-slate-500">@{username}</p>
        </div>
        <Link href={`/profile/${encodeURIComponent(username)}`} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          Back to profile
        </Link>
      </section>

      {!currentUser && isMutual ? (
        <EmptyState title="Select an active user" message="Choose your account in the top navigation to view mutual follows." />
      ) : loading ? (
        <EmptyState title={`Loading ${label.toLowerCase()}`} message="Fetching users from Neo4j..." />
      ) : currentUser || visibleUsers.length ? (
        <section className="space-y-3">
          {currentUser ? (
            <Link
              href={`/profile/${encodeURIComponent(currentUser)}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <p className="text-base font-semibold">@{currentUser}</p>
                <p className="mt-1 text-sm text-white/75">You</p>
              </div>
              <span className="text-sm text-white/70">→</span>
            </Link>
          ) : null}

          {visibleUsers.map((user) => (
            <Link
              key={user.username}
              href={`/profile/${encodeURIComponent(user.username)}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <p className="text-base font-semibold text-slate-900">@{user.username}</p>
                <p className="mt-1 text-sm text-slate-500">Open profile</p>
              </div>
              <span className="text-sm text-slate-400">→</span>
            </Link>
          ))}
        </section>
      ) : (
        <EmptyState title={`No ${label.toLowerCase()} yet`} message={`This profile has no ${label.toLowerCase()} to show right now.`} />
      )}
    </div>
  )
}

export default ProfileSectionPage
