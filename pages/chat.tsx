import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '../components/EmptyState'
import { useUserContext } from '../components/UserContext'

function formatThreadTime(value: number): string {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function clampPreview(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) {
    return 'Start a conversation'
  }

  return trimmed.length > 58 ? `${trimmed.slice(0, 58)}...` : trimmed
}

const ChatPage: NextPage = () => {
  const { currentUser, users } = useUserContext()
  const [searchValue, setSearchValue] = useState('')
  const [threads, setThreads] = useState<Array<{ username: string; body: string; createdAt: number; sentByMe: boolean }>>([])
  const [isLoadingThreads, setIsLoadingThreads] = useState(false)

  const normalizedSearch = searchValue.trim().toLowerCase()

  const suggestedUsers = useMemo(() => {
    if (!currentUser || !normalizedSearch) {
      return []
    }

    return users.filter((user) => {
      if (user.username === currentUser) {
        return false
      }

      return user.username.toLowerCase().includes(normalizedSearch)
    })
  }, [users, currentUser, normalizedSearch])

  const visibleThreads = useMemo(() => {
    if (!normalizedSearch) {
      return threads
    }

    return threads.filter((thread) => thread.username.toLowerCase().includes(normalizedSearch))
  }, [threads, normalizedSearch])

  async function loadThreads(activeUser: string, search = '', isBackground = false) {
    if (!activeUser) {
      setThreads([])
      return
    }

    if (!isBackground) {
      setIsLoadingThreads(true)
    }

    try {
      const response = await fetch(
        `/api/instagram/chat?mode=threads&username=${encodeURIComponent(activeUser)}&search=${encodeURIComponent(search)}&limit=40`
      )

      if (!response.ok) {
        throw new Error('Failed to load chat threads')
      }

      const data = await response.json()
      const list = Array.isArray(data.threads) ? data.threads : []
      setThreads(list)
    } finally {
      if (!isBackground) {
        setIsLoadingThreads(false)
      }
    }
  }

  useEffect(() => {
    if (!currentUser) {
      setThreads([])
      return
    }

    loadThreads(currentUser).catch((error) => console.error(error))
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) {
      return
    }

    const timer = window.setInterval(() => {
      loadThreads(currentUser, normalizedSearch, true).catch((error) => console.error(error))
    }, 3500)

    return () => window.clearInterval(timer)
  }, [currentUser, normalizedSearch])

  return (
    <div className="space-y-4">
      <Head>
        <title>Social Chat</title>
      </Head>

      {!currentUser ? (
        <EmptyState title="Select an active user" message="Choose your account in the top navigation to open social chat." />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Search or start a chat</label>
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search by username"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400"
              />
              {suggestedUsers.length ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Start a new chat</p>
                  <div className="space-y-2">
                    {suggestedUsers.map((user) => (
                      <Link
                        key={user.username}
                        href={`/chat/${encodeURIComponent(user.username)}`}
                        className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                      >
                        <span>@{user.username}</span>
                        <span className="text-[11px] font-semibold text-sky-700">Open</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Recent chats</p>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {isLoadingThreads ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">Loading chats...</p>
                ) : visibleThreads.length ? (
                  visibleThreads.map((thread) => {
                    return (
                      <Link
                        key={thread.username}
                        href={`/chat/${encodeURIComponent(thread.username)}`}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">@{thread.username}</p>
                          <p className="text-[11px] font-medium text-slate-500">{formatThreadTime(thread.createdAt)}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {thread.sentByMe ? 'You: ' : ''}
                          {clampPreview(thread.body)}
                        </p>
                      </Link>
                    )
                  })
                ) : (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    {normalizedSearch ? 'No chats match your search.' : 'No chats yet. Search someone to start a conversation.'}
                  </p>
                )}
              </div>
            </div>
          </aside>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <EmptyState
              title="Open a chat"
              message="Tap a recent conversation or search result to leave this page and open the dedicated message screen."
            />
          </div>
        </section>
      )}
    </div>
  )
}

export default ChatPage
