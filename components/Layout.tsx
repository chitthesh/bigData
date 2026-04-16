import { ReactNode, useState } from 'react'

import { InstagramNavbar } from './InstagramNavbar'
import { useUserContext } from './UserContext'

type LayoutProps = {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const { createUser } = useUserContext()
  const [creating, setCreating] = useState(false)

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e0ecff_0%,#f8fafc_38%,#f6f7fb_100%)]">
      <InstagramNavbar onCreateUser={handleCreateUser} creating={creating} />

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 pb-8 pt-28 md:px-6 md:pt-24">
        <div className="min-w-0 flex-1 rounded-3xl border border-white/80 bg-white/80 p-3 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur md:p-5">
          {children}
        </div>
      </div>
    </div>
  )
}

export { Layout }
