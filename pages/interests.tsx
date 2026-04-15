import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '../components/EmptyState'
import { SectionHeader } from '../components/SectionHeader'
import { useUserContext } from '../components/UserContext'

type Recommendation = {
  username: string
  score: number
  mutualFriends: number
  sharedInterests: number
}

const InterestsPage: NextPage = () => {
  const { currentUser } = useUserContext()
  const [interests, setInterests] = useState<string[]>([])
  const [newInterest, setNewInterest] = useState('')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])

  async function loadInterests(username: string) {
    const response = await fetch(`/api/interests?username=${encodeURIComponent(username)}`)
    if (!response.ok) {
      throw new Error('Failed to load interests')
    }

    const data = await response.json()
    setInterests(Array.isArray(data.interests) ? data.interests : [])
  }

  async function loadRecommendations(username: string) {
    const response = await fetch(`/api/recommendations/interests?username=${encodeURIComponent(username)}&limit=8`)
    if (!response.ok) {
      throw new Error('Failed to load recommendations')
    }

    const data = await response.json()
    setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : [])
  }

  async function addInterest() {
    if (!currentUser || !newInterest.trim()) {
      return
    }

    const response = await fetch('/api/interests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: currentUser, interest: newInterest.trim() })
    })

    if (!response.ok) {
      throw new Error('Failed to add interest')
    }

    setNewInterest('')
    await loadInterests(currentUser)
    await loadRecommendations(currentUser)
  }

  useEffect(() => {
    if (!currentUser) {
      setInterests([])
      setRecommendations([])
      return
    }

    loadInterests(currentUser).catch((error) => console.error(error))
    loadRecommendations(currentUser).catch((error) => console.error(error))
  }, [currentUser])

  const sharedCount = useMemo(() => interests.length, [interests])

  return (
    <div className="space-y-6">
      <Head>
        <title>Interests</title>
      </Head>

      <SectionHeader title="Interests" description="Track user interests and power better recommendations." />

      {!currentUser ? (
        <EmptyState title="Select an active user" message="Choose a user from the sidebar to manage interests." />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">Add interest</label>
            <input
              value={newInterest}
              onChange={(event) => setNewInterest(event.target.value)}
              placeholder="e.g. photography"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <button
              onClick={() => addInterest().catch((error) => console.error(error))}
              className="w-full rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Save Interest
            </button>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Current interests</p>
              <div className="flex flex-wrap gap-2">
                {interests.length ? interests.map((interest) => (
                  <span key={interest} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {interest}
                  </span>
                )) : <span className="text-sm text-slate-500">No interests yet</span>}
              </div>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-700">
              You currently have {sharedCount} recorded interests.
            </div>
          </div>

          <div className="space-y-4">
            <SectionHeader title="Interest Recommendations" description="Candidates ranked by shared interests plus mutual friends." />
            <div className="space-y-3">
              {recommendations.length ? recommendations.map((item) => (
                <div key={item.username} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">@{item.username}</p>
                      <p className="text-sm text-slate-500">{item.mutualFriends} mutual friends • {item.sharedInterests} shared interests</p>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Score {item.score}
                    </div>
                  </div>
                </div>
              )) : <EmptyState title="No recommendations" message="Add more interests or friendships to unlock smart matches." />}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default InterestsPage
