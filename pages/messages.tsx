import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '../components/EmptyState'
import { SectionHeader } from '../components/SectionHeader'
import { useUserContext } from '../components/UserContext'

type MessageItem = {
  sender: string
  recipient: string
  body: string
  createdAt: number
}

const MessagesPage: NextPage = () => {
  const { currentUser, users } = useUserContext()
  const [recipient, setRecipient] = useState('')
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<MessageItem[]>([])

  const recipientOptions = useMemo(
    () => users.filter((user) => user.username !== currentUser),
    [users, currentUser]
  )

  async function loadConversation(activeUser: string, targetUser: string) {
    if (!targetUser) {
      setMessages([])
      return
    }

    const response = await fetch(`/api/messages?userA=${encodeURIComponent(activeUser)}&userB=${encodeURIComponent(targetUser)}`)
    if (!response.ok) {
      throw new Error('Failed to load conversation')
    }

    const data = await response.json()
    setMessages(Array.isArray(data.messages) ? data.messages : [])
  }

  async function sendMessage() {
    if (!currentUser || !recipient || !draft.trim()) {
      return
    }

    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: currentUser, to: recipient, body: draft.trim() })
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    setDraft('')
    await loadConversation(currentUser, recipient)
  }

  useEffect(() => {
    if (!currentUser || !recipient) {
      setMessages([])
      return
    }

    loadConversation(currentUser, recipient).catch((error) => console.error(error))
  }, [currentUser, recipient])

  return (
    <div className="space-y-6">
      <Head>
        <title>Messages</title>
      </Head>

      <SectionHeader title="Messaging" description="Send direct messages between users." />

      {!currentUser ? (
        <EmptyState title="Select a user" message="Choose an active user from the sidebar before sending messages." />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">Recipient</label>
            <select
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select recipient</option>
              {recipientOptions.map((user) => (
                <option key={user.username} value={user.username}>
                  {user.username}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium text-slate-700">Message</label>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              placeholder="Type your message..."
            />

            <button
              onClick={() => sendMessage().catch((error) => console.error(error))}
              className="w-full rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Send Message
            </button>
          </div>

          <div className="space-y-4">
            <SectionHeader title="Conversation" description="Selected user chat history." />
            {recipient ? (
              <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                {messages.length ? (
                  messages.map((message) => (
                    <div
                      key={`${message.sender}-${message.createdAt}`}
                      className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm ${
                        message.sender === currentUser
                          ? 'ml-auto bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <p className="mb-1 text-[11px] uppercase tracking-wide opacity-70">
                        {message.sender} → {message.recipient}
                      </p>
                      <p>{message.body}</p>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No messages yet" message="Start the conversation to populate the thread." />
                )}
              </div>
            ) : (
              <EmptyState title="Pick a recipient" message="Choose a user to load the chat interface." />
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default MessagesPage
