import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'

import { EmptyState } from '../components/EmptyState'
import { useUserContext } from '../components/UserContext'

type NotificationItem = {
  type: string
  text: string
  createdAt: number
}

function timeAgo(epochMillis: number): string {
  const diff = Date.now() - epochMillis
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

const NotificationsPage: NextPage = () => {
  const { currentUser } = useUserContext()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  async function loadNotifications(username: string) {
    const response = await fetch(`/api/notifications?username=${encodeURIComponent(username)}&limit=20`)
    if (!response.ok) {
      throw new Error('Failed to load notifications')
    }

    const data = await response.json()
    setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
  }

  useEffect(() => {
    if (!currentUser) {
      setNotifications([])
      return
    }

    loadNotifications(currentUser).catch((error) => console.error(error))
  }, [currentUser])

  return (
    <div className="space-y-4">
      <Head>
        <title>Notifications</title>
      </Head>

      {!currentUser ? (
        <EmptyState title="Select a user" message="Choose an active user to view their notification feed." />
      ) : notifications.length ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={`${notification.type}-${notification.createdAt}`} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between gap-2">
                <p className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{notification.type}</p>
                <p className="text-xs text-slate-400">{timeAgo(notification.createdAt)}</p>
              </div>
              <p className="mt-2 text-sm text-slate-700">{notification.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No notifications" message="Connection activity and messages will show up here." />
      )}
    </div>
  )
}

export default NotificationsPage
