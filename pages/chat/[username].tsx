import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'

import { EmptyState } from '../../components/EmptyState'
import { useUserContext } from '../../components/UserContext'
import type { ChatMessage, ChatThread } from '../../types/instagram'

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

const ChatThreadPage: NextPage = () => {
  const router = useRouter()
  const { currentUser, users } = useUserContext()
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isLoadingThreads, setIsLoadingThreads] = useState(false)
  const threadRef = useRef<HTMLDivElement | null>(null)

  const chatUser = useMemo(() => {
    const value = router.query.username
    if (Array.isArray(value)) {
      return value[0] ?? ''
    }

    return typeof value === 'string' ? value : ''
  }, [router.query.username])

  const otherUserExists = users.some((user) => user.username === chatUser)
  const activeThread = threads.find((thread) => thread.username === chatUser)

  async function loadThreads(activeUser: string, isBackground = false) {
    if (!activeUser) {
      setThreads([])
      return
    }

    if (!isBackground) {
      setIsLoadingThreads(true)
    }

    try {
      const response = await fetch(
        `/api/instagram/chat?mode=threads&username=${encodeURIComponent(activeUser)}&limit=40`
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

    if (!currentUser || !chatUser || !draft.trim() || isSending) {
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
          to: chatUser,
          body: draft.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setDraft('')
      await Promise.all([loadConversation(currentUser, chatUser), loadThreads(currentUser)])
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    if (!currentUser || !chatUser) {
      setMessages([])
      return
    }

    loadConversation(currentUser, chatUser).catch((error) => console.error(error))
    loadThreads(currentUser).catch((error) => console.error(error))
  }, [currentUser, chatUser])

  useEffect(() => {
    if (!currentUser || !chatUser) {
      return
    }

    const timer = window.setInterval(() => {
      loadConversation(currentUser, chatUser, true).catch((error) => console.error(error))
      loadThreads(currentUser, true).catch((error) => console.error(error))
    }, 3500)

    return () => window.clearInterval(timer)
  }, [currentUser, chatUser])

  useEffect(() => {
    if (!threadRef.current) {
      return
    }

    threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [messages.length])

  if (!currentUser) {
    return <EmptyState title="Select an active user" message="Choose your account in the top navigation to open a chat." />
  }

  if (!chatUser) {
    return <EmptyState title="Open a conversation" message="Pick a user from the inbox to load the dedicated chat screen." />
  }

  return (
    <div className="space-y-6">
      <Head>
        <title>Chat with @{chatUser}</title>
      </Head>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Direct messages</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">@{chatUser}</h1>
          </div>
          <Link
            href="/chat"
            aria-label="Back to inbox"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
              <path d="M15 6 9 12l6 6" />
            </svg>
          </Link>
        </div>
      </section>

      {!otherUserExists ? (
        <EmptyState title="User not found" message="This username is not available in the current user list." />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Recent chats</p>
              <div className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
                {isLoadingThreads ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">Loading chats...</p>
                ) : threads.length ? (
                  threads.map((thread) => {
                    const isActive = thread.username === chatUser
                    return (
                      <Link
                        key={thread.username}
                        href={`/chat/${encodeURIComponent(thread.username)}`}
                        className={`block rounded-xl border px-3 py-2 transition ${
                          isActive ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
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
                      </Link>
                    )
                  })
                ) : (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">No recent chats yet.</p>
                )}
              </div>
            </div>
          </aside>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Conversation</p>
                  <h2 className="text-lg font-semibold text-slate-900">@{chatUser}</h2>
                </div>
                <p className="text-xs text-slate-500">{activeThread ? `Last message ${formatThreadTime(activeThread.createdAt)}` : 'New chat'}</p>
              </div>

              <div ref={threadRef} className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
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
                  <EmptyState title="No messages yet" message="Send the first message to start this thread." />
                )}
              </div>

              <form onSubmit={(event) => handleSend(event).catch((error) => console.error(error))} className="border-t border-slate-100 pt-3">
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={`Message @${chatUser}`}
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
          </div>
        </section>
      )}
    </div>
  )
}

export default ChatThreadPage
