import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { FormEvent, useMemo, useState } from 'react'

import { useUserContext } from '../components/UserContext'

const LoginPage: NextPage = () => {
  const router = useRouter()
  const { users, setCurrentUser, createUser } = useUserContext()
  const [selectedUsername, setSelectedUsername] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const hasUsers = useMemo(() => users.length > 0, [users])

  async function handleExistingLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedUsername) {
      return
    }

    setCurrentUser(selectedUsername)
    await router.push('/')
  }

  async function handleCreateAndLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const username = newUsername.trim().toLowerCase()
    if (!username) {
      return
    }

    setSubmitting(true)
    try {
      await createUser(username)
      await router.push('/')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center px-4">
      <Head>
        <title>Login | InstaMini</title>
      </Head>

      <section className="grid w-full gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500 via-rose-500 to-orange-400 p-6 text-white">
          <h1 className="text-3xl font-semibold">InstaMini</h1>
          <p className="mt-3 text-sm text-white/90">
            Mock login screen for a realistic college mini-project experience.
          </p>
          <p className="mt-6 text-xs uppercase tracking-[0.16em] text-white/80">Neo4j + Next.js + Tailwind</p>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Login</h2>
            <p className="text-sm text-slate-500">Pick an existing user or create a new one.</p>
          </div>

          <form onSubmit={(event) => handleExistingLogin(event).catch((error) => console.error(error))} className="space-y-3">
            <label className="text-sm font-medium text-slate-700">Existing user</label>
            <select
              value={selectedUsername}
              onChange={(event) => setSelectedUsername(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              disabled={!hasUsers}
            >
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.username} value={user.username}>
                  {user.username}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!selectedUsername}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Continue as selected user
            </button>
          </form>

          <form onSubmit={(event) => handleCreateAndLogin(event).catch((error) => console.error(error))} className="space-y-3 border-t border-slate-200 pt-4">
            <label className="text-sm font-medium text-slate-700">Create new user</label>
            <input
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              placeholder="e.g. harsh"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={submitting || !newUsername.trim()}
              className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create and login'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default LoginPage
