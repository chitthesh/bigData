import { ReactNode, useState } from 'react'

import { InstagramNavbar } from './InstagramNavbar'
import { InstagramSidebar } from './InstagramSidebar'
import { useUserContext } from './UserContext'

type LayoutProps = {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const { currentUser, users, setCurrentUser, createUser, refreshUsers } = useUserContext()
  const [creating, setCreating] = useState(false)
  const [seeding, setSeeding] = useState(false)

  async function handleCreateUser() {
    if (creating) {
      return
    }

    const username = prompt('Enter a new username')
    if (!username) {
      return
    }

    try {
      setCreating(true)
      await createUser(username)
    } catch (error) {
      console.error(error)
      alert('Unable to create user. Check server logs.')
    } finally {
      setCreating(false)
    }
  }

  async function handleSeedDemo() {
    if (seeding) {
      return
    }

    try {
      setSeeding(true)
      const response = await fetch('/api/seed-demo', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to seed demo data')
      }

      await refreshUsers()
      setCurrentUser('alice')
    } catch (error) {
      console.error(error)
      alert('Unable to seed demo data. Check server logs.')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fde7f3_0%,#f8fafc_35%,#eef2ff_100%)]">
      <InstagramNavbar onCreateUser={handleCreateUser} creating={creating} />

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 pb-8 pt-28 md:px-6 md:pt-24">
        <InstagramSidebar />
        <div className="min-w-0 flex-1 rounded-3xl border border-white/70 bg-white/70 p-3 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur md:p-5">
          {children}
        </div>
        <aside className="hidden w-64 shrink-0 xl:block">
          <div className="sticky top-28 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-800">Session Controls</p>
            <p className="text-xs text-slate-500">User: {currentUser ? `@${currentUser}` : 'none selected'}</p>
            <p className="text-xs text-slate-500">Users loaded: {users.length}</p>
            <button
              onClick={handleSeedDemo}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-2 text-sm font-semibold text-white"
            >
              {seeding ? 'Seeding...' : 'Seed Demo Data'}
            </button>
            <button
              onClick={() => refreshUsers().catch((error) => console.error(error))}
              className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Refresh Users
            </button>
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
              Top navbar stays fixed. Scroll the feed while keeping core actions visible.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

export { Layout }
