import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '../components/EmptyState'
import { SectionHeader } from '../components/SectionHeader'
import { StatCard } from '../components/StatCard'
import { useUserContext } from '../components/UserContext'

type DashboardAnalytics = {
  totalUsers: number
  totalConnections: number
  topConnectedUsers: { username: string; connections: number; score: number }[]
  influentialUsers: { username: string; connections: number; score: number }[]
  communities: { id: number; members: string[] }[]
}

type NotificationItem = {
  type: string
  text: string
  createdAt: number
}

function formatRelativeTime(epochMillis: number): string {
  const deltaMs = Date.now() - epochMillis
  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    return 'just now'
  }

  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (deltaMs < minute) return 'just now'
  if (deltaMs < hour) return `${Math.floor(deltaMs / minute)}m ago`
  if (deltaMs < day) return `${Math.floor(deltaMs / hour)}h ago`
  return `${Math.floor(deltaMs / day)}d ago`
}

function toPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return '0%'
  }
  return `${Math.round(value * 100)}%`
}

const DashboardPage: NextPage = () => {
  const { currentUser } = useUserContext()
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [notificationsError, setNotificationsError] = useState<string | null>(null)

  async function loadDashboard() {
    try {
      setIsLoadingAnalytics(true)
      setAnalyticsError(null)

      const response = await fetch('/api/analytics/dashboard')
      if (!response.ok) {
        throw new Error('Failed to load dashboard')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error(error)
      setAnalyticsError('Could not load analytics. Please try refreshing this page.')
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  async function loadNotifications(username: string) {
    try {
      setIsLoadingNotifications(true)
      setNotificationsError(null)

      const response = await fetch(`/api/notifications?username=${encodeURIComponent(username)}&limit=8`)
      if (!response.ok) {
        throw new Error('Failed to load notifications')
      }

      const data = await response.json()
      setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
    } catch (error) {
      console.error(error)
      setNotificationsError('Could not load notifications for this user.')
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setNotifications([])
      setNotificationsError(null)
      return
    }

    loadNotifications(currentUser)
  }, [currentUser])

  const topUsers = useMemo(() => analytics?.topConnectedUsers ?? [], [analytics])

  const networkStats = useMemo(() => {
    if (!analytics || analytics.totalUsers <= 1) {
      return {
        maxPossibleConnections: 0,
        density: 0,
        averageConnections: 0,
        largestCommunitySize: 0,
        largestCommunityShare: 0
      }
    }

    const maxPossibleConnections = (analytics.totalUsers * (analytics.totalUsers - 1)) / 2
    const density = maxPossibleConnections ? analytics.totalConnections / maxPossibleConnections : 0
    const averageConnections = analytics.totalUsers ? (analytics.totalConnections * 2) / analytics.totalUsers : 0
    const largestCommunitySize = analytics.communities.reduce((max, community) => Math.max(max, community.members.length), 0)
    const largestCommunityShare = analytics.totalUsers ? largestCommunitySize / analytics.totalUsers : 0

    return {
      maxPossibleConnections,
      density,
      averageConnections,
      largestCommunitySize,
      largestCommunityShare
    }
  }, [analytics])

  const topInfluencers = useMemo(() => analytics?.influentialUsers.slice(0, 5) ?? [], [analytics])

  return (
    <div className="space-y-8">
      <Head>
        <title>Network Dashboard</title>
      </Head>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-700 to-emerald-500 p-8 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-44 w-44 rounded-full bg-cyan-200/20 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Social Network Analyzer</p>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Network Intelligence Dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-100 md:text-base">
              Live graph insights for communities, influence, and activity signals across your social network.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              loadDashboard()
              if (currentUser) {
                loadNotifications(currentUser)
              }
            }}
            className="rounded-full border border-white/40 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
          >
            Refresh Data
          </button>
        </div>
      </section>

      {isLoadingAnalytics && !analytics ? (
        <EmptyState title="Loading analytics" message="Crunching graph metrics from Neo4j..." />
      ) : analyticsError ? (
        <EmptyState title="Analytics unavailable" message={analyticsError} />
      ) : analytics ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Users" value={analytics.totalUsers} />
            <StatCard label="Total Connections" value={analytics.totalConnections} />
            <StatCard label="Communities" value={analytics.communities.length} />
            <StatCard label="Network Density" value={toPercent(networkStats.density)} />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Average Connections</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{networkStats.averageConnections.toFixed(1)}</p>
              <p className="mt-1 text-sm text-slate-500">per user across the network graph</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Largest Community</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{networkStats.largestCommunitySize}</p>
              <p className="mt-1 text-sm text-slate-500">{toPercent(networkStats.largestCommunityShare)} of all users</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Possible Connections</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{networkStats.maxPossibleConnections}</p>
              <p className="mt-1 text-sm text-slate-500">theoretical max at current user count</p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div>
              <SectionHeader title="Popular Users" description="Highest degree centrality with visual influence bars." />
              <div className="space-y-3">
                {topUsers.map((user) => (
                  <div key={user.username} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">@{user.username}</p>
                        <p className="text-sm text-slate-500">Connections: {user.connections}</p>
                      </div>
                      <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                        Influence {toPercent(user.score)}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                        style={{ width: `${Math.max(4, Math.round(user.score * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionHeader title="Communities" description="Connected clusters ranked by member count." />
              <div className="space-y-3">
                {[...analytics.communities]
                  .sort((a, b) => b.members.length - a.members.length)
                  .map((community) => (
                  <div key={community.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">Cluster {community.id}</p>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {community.members.length} members
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {community.members.map((member) => (
                        <span key={`${community.id}-${member}`} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          @{member}
                        </span>
                      ))}
                    </div>
                  </div>
                  ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <EmptyState title="No analytics yet" message="Seed demo users and friendships to generate dashboard metrics." />
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <div>
          <SectionHeader title="Influential Users" description="Top centrality leaders likely to spread information fastest." />
          <div className="space-y-3">
            {topInfluencers.map((user, index) => (
              <div key={user.username} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Rank #{index + 1}</p>
                    <p className="font-semibold text-slate-900">@{user.username}</p>
                  </div>
                  <p className="text-sm text-slate-500">Score {user.score.toFixed(3)}</p>
                </div>
              </div>
            ))}
            {!topInfluencers.length ? (
              <EmptyState title="No influence data" message="Influence rankings will appear after analytics are computed." />
            ) : null}
          </div>
        </div>

        <div>
          <SectionHeader title="Recent Notifications" description="Connection and message activity for the active user." />
          {currentUser ? (
            <div className="space-y-3">
              {isLoadingNotifications && !notifications.length ? (
                <EmptyState title="Loading notifications" message="Fetching recent activity..." />
              ) : null}
              {notificationsError ? <EmptyState title="Notifications unavailable" message={notificationsError} /> : null}
              {notifications.map((notification) => (
                <div key={`${notification.type}-${notification.createdAt}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">{notification.type}</p>
                    <p className="text-xs text-slate-400">{formatRelativeTime(notification.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{notification.text}</p>
                </div>
              ))}
              {!notifications.length && !isLoadingNotifications && !notificationsError ? (
                <EmptyState title="No notifications yet" message="New friend connections and messages will appear here." />
              ) : null}
            </div>
          ) : (
            <EmptyState title="Select a user" message="Notifications are shown for the current active user." />
          )}
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
