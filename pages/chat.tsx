import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useMemo, useRef, useState } from 'react'

import { EmptyState } from '../components/EmptyState'
import { useUserContext } from '../components/UserContext'
import type { ChatMessage } from '../types/instagram'

function formatTime(value: number): string {
  if (!value) {
    return ''
  }
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const ChatPage: NextPage = () => {
  const { currentUser, users } = useUserContext()
  const [recipient, setRecipient] = useState('')
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [receivingEnabled, setReceivingEnabled] = useState(true)
  const [newMessageHint, setNewMessageHint] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const threadRef = useRef<HTMLDivElement | null>(null)
  const latestMessageRef = useRef<number>(0)

  const recipients = useMemo(() => users.filter((user) => user.username !== currentUser), [users, currentUser])

  async function loadConversation(isBackground = false) {
    if (!currentUser || !recipient) {
      setMessages([])
      latestMessageRef.current = 0
      return
    }

    if (!isBackground) {
      setIsRefreshing(true)
    }

    const response = await fetch(
      `/api/instagram/chat?userA=${encodeURIComponent(currentUser)}&userB=${encodeURIComponent(recipient)}`
    )

    if (!response.ok) {
      throw new Error('Failed to load chat')
    }

    const data = await response.json()
    const incoming = Array.isArray(data.messages) ? data.messages : []
    const previousLast = latestMessageRef.current
    const latestIncoming = incoming.length ? Number(incoming[incoming.length - 1].createdAt ?? 0) : 0
    const hasNewIncoming =
      isBackground &&
      latestIncoming > previousLast &&
      incoming.some((message: ChatMessage) => message.sender !== currentUser && Number(message.createdAt) > previousLast)

    setMessages(incoming)
    latestMessageRef.current = latestIncoming
    if (hasNewIncoming) {
      setNewMessageHint('New message received')
    }

    if (!isBackground) {
      setIsRefreshing(false)
    }
  }

  async function sendMessage() {
    if (!currentUser || !recipient || !draft.trim()) {
      return
    }

    const response = await fetch('/api/instagram/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: currentUser,
        to: recipient,
        body: draft.trim()
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    setDraft('')
    await loadConversation(false)
  }

  useEffect(() => {
    setNewMessageHint('')
    loadConversation(false).catch((error) => console.error(error))
  }, [currentUser, recipient])

  useEffect(() => {
    if (!currentUser || !recipient || !receivingEnabled) {
      return
    }

    const timer = setInterval(() => {
      loadConversation(true).catch((error) => console.error(error))
    }, 3000)

    return () => clearInterval(timer)
  }, [currentUser, recipient, receivingEnabled])

  useEffect(() => {
    if (!threadRef.current) {
      return
    }

    threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [messages.length])

  return (
    <div className="space-y-6">
      <Head>
        <title>Chat</title>
      </Head>

      <section className="rounded-3xl bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-400 p-6 text-white shadow-lg">
        <h1 className="text-3xl font-semibold">Direct Messages</h1>
        <p className="mt-2 text-sm text-white/90">Real-time-like receiving mode is enabled with periodic sync.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setReceivingEnabled((value) => !value)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              receivingEnabled ? 'bg-white text-sky-700' : 'bg-black/20 text-white'
            }`}
          >
            {receivingEnabled ? 'Receiving ON' : 'Receiving OFF'}
          </button>
          <button
            onClick={() => loadConversation(false).catch((error) => console.error(error))}
            className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh now'}
          </button>
          {newMessageHint ? <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">{newMessageHint}</span> : null}
        </div>
      </section>

      {!currentUser ? (
        <EmptyState title="Select an active user" message="Choose your account in the top navigation to open chats." />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-medium text-slate-700">Recipient</label>
            <select
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select user</option>
              {recipients.map((user) => (
                <option key={user.username} value={user.username}>
                  {user.username}
                </option>
              ))}
            </select>

            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder="Write a message..."
            />

            <button
              onClick={() => sendMessage().catch((error) => console.error(error))}
              disabled={!recipient || !draft.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Send
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            {!recipient ? (
              <EmptyState title="Choose a recipient" message="Select a user to start the conversation." />
            ) : messages.length ? (
              <div ref={threadRef} className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                {messages.map((message, index) => {
                  const own = message.sender === currentUser
                  return (
                    <div
                      key={`${message.sender}-${message.createdAt}-${index}`}
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm transition ${
                        own
                          ? 'ml-auto bg-gradient-to-r from-slate-900 to-slate-700 text-white'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      <p className="mb-1 text-[11px] opacity-80">{message.sender}</p>
                      <p>{message.body}</p>
                      <p className="mt-1 text-[10px] opacity-70">{formatTime(message.createdAt)}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState title="No messages yet" message="Send the first message to begin this chat." />
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default ChatPage
