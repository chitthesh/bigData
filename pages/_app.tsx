import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { PageTransition } from '../components/PageTransition'
import { Layout } from '../components/Layout'
import { UserContext, UserSummary } from '../components/UserContext'

const INTRO_STORAGE_KEY = 'intro-seen-v2'
const AUTH_STORAGE_KEY = 'auth-user'
const LEGACY_AUTH_STORAGE_KEY = 'logedinas'

const INTRO_PROFILES = {
  fast: {
    minDurationMs: 900,
    settleDurationMs: 180
  },
  cinematic: {
    minDurationMs: 1700,
    settleDurationMs: 420
  }
} as const

type IntroProfile = keyof typeof INTRO_PROFILES

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [currentUser, setCurrentUserState] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [introActive, setIntroActive] = useState(false)
  const [introProgress, setIntroProgress] = useState(0)
  const [introMessage, setIntroMessage] = useState('Starting secure session...')
  const [introProfile, setIntroProfile] = useState<IntroProfile>('cinematic')
  const [usersReady, setUsersReady] = useState(false)
  const [introStartedAt, setIntroStartedAt] = useState<number | null>(null)

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
      localStorage.setItem(AUTH_STORAGE_KEY, username)
      localStorage.setItem(LEGACY_AUTH_STORAGE_KEY, username)
    },
    [refreshUsers]
  )

  const loginUser = useCallback(
    async (username: string, password: string) => {
      const cleanedUsername = username.trim().toLowerCase()
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: cleanedUsername, password })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to login')
      }

      setCurrentUserState(cleanedUsername)
      localStorage.setItem(AUTH_STORAGE_KEY, cleanedUsername)
      localStorage.setItem(LEGACY_AUTH_STORAGE_KEY, cleanedUsername)
      await refreshUsers()
    },
    [refreshUsers]
  )

  const registerUser = useCallback(
    async (username: string, password: string) => {
      const cleanedUsername = username.trim().toLowerCase()
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: cleanedUsername, password })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to register')
      }

      setCurrentUserState(cleanedUsername)
      localStorage.setItem(AUTH_STORAGE_KEY, cleanedUsername)
      localStorage.setItem(LEGACY_AUTH_STORAGE_KEY, cleanedUsername)
      await refreshUsers()
    },
    [refreshUsers]
  )

  const setCurrentUser = useCallback((username: string) => {
    if (!username) {
      return
    }

    setCurrentUserState(username)
    localStorage.setItem(AUTH_STORAGE_KEY, username)
    localStorage.setItem(LEGACY_AUTH_STORAGE_KEY, username)
  }, [])

  const logout = useCallback(() => {
    setCurrentUserState(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const hasSeenIntro = window.sessionStorage.getItem(INTRO_STORAGE_KEY) === '1'
    if (hasSeenIntro) {
      return
    }

    setIntroProfile('cinematic')
    setIntroActive(true)
    setIntroProgress(12)
    setIntroMessage('Starting secure session...')
    setIntroStartedAt(Date.now())
    window.sessionStorage.setItem(INTRO_STORAGE_KEY, '1')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const currentUrl = new URL(window.location.href)
    const searchParams = currentUrl.searchParams
    const forceIntro = searchParams.get('intro') === '1'
    if (!forceIntro) {
      return
    }

    const profileQuery = searchParams.get('introStyle')
    const selectedProfile: IntroProfile = profileQuery === 'fast' ? 'fast' : 'cinematic'

    setIntroProfile(selectedProfile)
    setIntroActive(true)
    setIntroProgress(12)
    setIntroMessage('Starting secure session...')
    setIntroStartedAt(Date.now())

    currentUrl.searchParams.delete('intro')
    currentUrl.searchParams.delete('introStyle')
    const cleanedSearch = currentUrl.searchParams.toString()
    const cleanedUrl = `${currentUrl.pathname}${cleanedSearch ? `?${cleanedSearch}` : ''}${currentUrl.hash}`
    window.history.replaceState({}, '', cleanedUrl)
  }, [router.asPath])

  useEffect(() => {
    if (!introActive) {
      return
    }

    if (!usersReady) {
      setIntroProgress((prev) => Math.max(prev, 46))
      setIntroMessage('Connecting to graph service...')
      return
    }

    setIntroProgress((prev) => Math.max(prev, 84))
    setIntroMessage('Loading recommendations and feed...')

    const profileConfig = INTRO_PROFILES[introProfile]
    const startedAt = introStartedAt ?? Date.now()
    const elapsed = Date.now() - startedAt
    const waitMs = Math.max(profileConfig.minDurationMs - elapsed, 0)
    let settleId: number | undefined

    const completeId = window.setTimeout(() => {
      setIntroProgress(100)
      setIntroMessage('Ready')

      settleId = window.setTimeout(() => {
        setIntroActive(false)
      }, profileConfig.settleDurationMs)
    }, waitMs)

    return () => {
      window.clearTimeout(completeId)
      if (typeof settleId === 'number') {
        window.clearTimeout(settleId)
      }
    }
  }, [introActive, usersReady, introStartedAt, introProfile])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(LEGACY_AUTH_STORAGE_KEY)
    if (stored) {
      setCurrentUserState(stored)
      localStorage.setItem(AUTH_STORAGE_KEY, stored)
    }

    refreshUsers()
      .catch((err) => console.error(err))
      .finally(() => {
        setUsersReady(true)
        setHydrated(true)
      })
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
      createUser,
      loginUser,
      registerUser
    }),
    [currentUser, users, setCurrentUser, logout, refreshUsers, createUser, loginUser, registerUser]
  )

  const showLayout = router.pathname !== '/login'

  return (
    <UserContext.Provider value={contextValue}>
      {showLayout ? (
        <Layout>
          <PageTransition introActive={introActive} introProgress={introProgress} introMessage={introMessage}>
            <Component {...pageProps} />
          </PageTransition>
        </Layout>
      ) : (
        <PageTransition introActive={introActive} introProgress={introProgress} introMessage={introMessage}>
          <Component {...pageProps} />
        </PageTransition>
      )}
    </UserContext.Provider>
  )
}

export default MyApp
