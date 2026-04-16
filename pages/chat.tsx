import type { NextPage } from 'next'
import Head from 'next/head'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'

import { EmptyState } from '../components/EmptyState'
import { useUserContext } from '../components/UserContext'
import type { ChatMessage, ChatThread } from '../types/instagram'

function formatTime(value: number): string {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

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
  const [draft, setDraft] = useState('')
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeChatUser, setActiveChatUser] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingThreads, setIsLoadingThreads] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const threadRef = useRef<HTMLDivElement | null>(null)

  const normalizedSearch = searchValue.trim().toLowerCase()

  const suggestedUsers = useMemo(() => {
    if (!currentUser) {
      return []
    }

    return users.filter((user) => {
      if (user.username === currentUser) {
        return false
      }

      if (!normalizedSearch) {
        return true
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

  async function loadConversation(activeUser: string, targetUser: string, isBackground = false) {
    if (!activeUser || !targetUser) {
      setMessages([])
      return
    }

    if (!isBackground) {
      setIsLoadingMessages(true)
    }

    try {
      const response = await fetch(
        `/api/instagram/chat?userA=${encodeURIComponent(activeUser)}&userB=${encodeURIComponent(targetUser)}`
      )

      if (!response.ok) {
        throw new Error('Failed to load chat messages')
      }

      const data = await response.json()
      setMessages(Array.isArray(data.messages) ? data.messages : [])
    } finally {
      if (!isBackground) {
        setIsLoadingMessages(false)
      }
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentUser || !activeChatUser || !draft.trim() || isSending) {
      return
    }

    try {
      setIsSending(true)

      const response = await fetch('/api/instagram/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: currentUser,
          to: activeChatUser,
          body: draft.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setDraft('')
      await Promise.all([loadConversation(currentUser, activeChatUser), loadThreads(currentUser, normalizedSearch)])
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    if (!currentUser) {
      setThreads([])
      setMessages([])
      setActiveChatUser('')
      return
    }

    loadThreads(currentUser).catch((error) => console.error(error))
  }, [currentUser])

  useEffect(() => {
    if (!currentUser || !activeChatUser) {
      setMessages([])
      return
    }

    loadConversation(currentUser, activeChatUser).catch((error) => console.error(error))
  }, [currentUser, activeChatUser])

  useEffect(() => {
    if (!currentUser) {
      return
    }

    const timer = window.setInterval(() => {
      loadThreads(currentUser, normalizedSearch, true).catch((error) => console.error(error))
      if (activeChatUser) {
        loadConversation(currentUser, activeChatUser, true).catch((error) => console.error(error))
      }
    }, 3500)

    return () => window.clearInterval(timer)
  }, [currentUser, activeChatUser, normalizedSearch])

  useEffect(() => {
    if (!threadRef.current) {
      return
    }

    threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [messages.length])

  function startChat(username: string) {
    setActiveChatUser(username)
  }

  const activeThread = threads.find((thread) => thread.username === activeChatUser)

  return (
    <div className="space-y-6">
      <Head>
        <title>Social Chat</title>
      </Head>

      <section className="rounded-3xl bg-gradient-to-r from-sky-700 via-cyan-600 to-emerald-500 p-6 text-white shadow-lg">
        <h1 className="text-3xl font-semibold">Social Media Chat</h1>
        <p className="mt-2 text-sm text-white/90">Search anyone, message instantly, and keep your recent chats in one place.</p>
      </section>

      {!currentUser ? (
        <EmptyState title="Select an active user" message="Choose your account in the top navigation to open social chat." />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Search users</label>
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search by username"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Chats</p>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {isLoadingThreads ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">Loading chats...</p>
                ) : visibleThreads.length ? (
                  visibleThreads.map((thread) => {
                    const isActive = thread.username === activeChatUser
                    return (
                      <button
                        key={thread.username}
                        onClick={() => startChat(thread.username)}
                        className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                          isActive
                            ? 'border-sky-300 bg-sky-50'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">@{thread.username}</p>
                          <p className="text-[11px] font-medium text-slate-500">{formatThreadTime(thread.createdAt)}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {thread.sentByMe ? 'You: ' : ''}
                          {clampPreview(thread.body)}
                        </p>
                      </button>
                    )
                  })
                ) : (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">No chats yet. Search and start one.</p>
                )}
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">People</p>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {suggestedUsers.length ? (
                  suggestedUsers.map((user) => (
                    <button
                      key={user.username}
                      onClick={() => startChat(user.username)}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span>@{user.username}</span>
                      <span className="text-[11px] font-semibold text-sky-700">Message</span>
                    </button>
                  ))
                ) : (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">No users match your search.</p>
                )}
              </div>
            </div>
          </aside>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            {!activeChatUser ? (
              <EmptyState title="Open a conversation" message="Pick a user from chats or search results to start messaging." />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Conversation</p>
                    <h2 className="text-lg font-semibold text-slate-900">@{activeChatUser}</h2>
                  </div>
                  <p className="text-xs text-slate-500">{activeThread ? `Last message ${formatThreadTime(activeThread.createdAt)}` : 'New chat'}</p>
                </div>

                <div ref={threadRef} className="max-h-[27rem] space-y-3 overflow-y-auto pr-1">
                  {isLoadingMessages ? (
                    <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">Loading messages...</p>
                  ) : messages.length ? (
                    messages.map((message, index) => {
                      const own = message.sender === currentUser
                      return (
                        <div
                          key={`${message.sender}-${message.createdAt}-${index}`}
                          className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                            own ? 'ml-auto bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          <p>{message.body}</p>
                          <p className="mt-1 text-[10px] opacity-70">{formatTime(message.createdAt)}</p>
                        </div>
                      )
                    })
                  ) : (
                    <EmptyState title="No messages yet" message="Send the first message and this chat will stay in your list." />
                  )}
                </div>

                <form onSubmit={(event) => handleSend(event).catch((error) => console.error(error))} className="border-t border-slate-100 pt-3">
                  <div className="flex gap-2">
                    <input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={`Message @${activeChatUser}`}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400"
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim() || isSending}
                      className="rounded-xl bg-gradient-to-r from-sky-700 to-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isSending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default ChatPage
