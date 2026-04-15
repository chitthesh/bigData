import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Layout } from '../components/Layout'
import { UserContext, UserSummary } from '../components/UserContext'

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [currentUser, setCurrentUserState] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const refreshUsers = useCallback(async () => {
    const response = await fetch('/api/users')
    if (!response.ok) {
      throw new Error('Failed to load users')
    }

    const data = await response.json()
    const list = Array.isArray(data.users) ? data.users : []
    const cleaned = list.filter(
      (user: UserSummary) => typeof user?.username === 'string' && user.username.trim().length > 0
    )
    setUsers(cleaned)
  }, [])

  const createUser = useCallback(
    async (username: string) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      })

      if (!response.ok) {
        throw new Error('Failed to create user')
      }

      await refreshUsers()
      setCurrentUserState(username)
      localStorage.setItem('logedinas', username)
    },
    [refreshUsers]
  )

  const setCurrentUser = useCallback((username: string) => {
    if (!username) {
      return
    }

    setCurrentUserState(username)
    localStorage.setItem('logedinas', username)
  }, [])

  const logout = useCallback(() => {
    setCurrentUserState(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('logedinas')
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored = localStorage.getItem('logedinas')
    if (stored) {
      setCurrentUserState(stored)
    }

    refreshUsers().catch((err) => console.error(err))
    setHydrated(true)
  }, [refreshUsers])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    if (!currentUser && router.pathname !== '/login') {
      router.replace('/login').catch((error) => console.error(error))
      return
    }

    if (currentUser && router.pathname === '/login') {
      router.replace('/').catch((error) => console.error(error))
    }
  }, [currentUser, hydrated, router])

  const contextValue = useMemo(
    () => ({
      currentUser,
      users,
      setCurrentUser,
      logout,
      refreshUsers,
      createUser
    }),
    [currentUser, users, setCurrentUser, logout, refreshUsers, createUser]
  )

  const showLayout = router.pathname !== '/login'

  return (
    <UserContext.Provider value={contextValue}>
      {showLayout ? (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      ) : (
        <Component {...pageProps} />
      )}
    </UserContext.Provider>
  )
}

export default MyApp
