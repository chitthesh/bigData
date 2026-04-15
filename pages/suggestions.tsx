import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'

import { EmptyState } from '../components/EmptyState'
import { SectionHeader } from '../components/SectionHeader'
import { UserCard } from '../components/UserCard'
import { useUserContext } from '../components/UserContext'

type Suggestion = {
  username: string
  connections: number
}

const SuggestionsPage: NextPage = () => {
  const { currentUser } = useUserContext()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  async function loadSuggestions(activeUser: string) {
    const response = await fetch(`/api/friends/suggestions?username=${encodeURIComponent(activeUser)}&limit=12`)
    if (!response.ok) {
      throw new Error('Failed to load suggestions')
    }

    const data = await response.json()
    setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : [])
  }

  async function handleAddFriend(target: string) {
    if (!currentUser) {
      return
    }

    await fetch('/api/friends/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userA: currentUser, userB: target })
    })

    await loadSuggestions(currentUser)
  }

  useEffect(() => {
    if (!currentUser) {
      setSuggestions([])
      return
    }

    loadSuggestions(currentUser).catch((err) => console.error(err))
  }, [currentUser])

  return (
    <div className="space-y-6">
      <Head>
        <title>Suggestions</title>
      </Head>

      <SectionHeader title="People You May Know" description="Friends of friends not connected to you yet." />

      {!currentUser ? (
        <EmptyState title="Select an active user" message="Pick a user from the header to see personalized suggestions." />
      ) : suggestions.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map((user) => (
            <UserCard
              key={user.username}
              username={user.username}
              connections={user.connections}
              onAdd={() => handleAddFriend(user.username)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No suggestions yet" message="Add more friends to unlock recommendations." />
      )}
    </div>
  )
}

export default SuggestionsPage
