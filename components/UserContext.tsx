import { createContext, useContext } from 'react'

type UserSummary = {
  username: string
}

type UserContextValue = {
  currentUser: string | null
  users: UserSummary[]
  setCurrentUser: (username: string) => void
  logout: () => void
  refreshUsers: () => Promise<void>
  createUser: (username: string) => Promise<void>
  loginUser: (username: string, password: string) => Promise<void>
  registerUser: (username: string, password: string) => Promise<void>
  continueWithGoogle: (email: string) => Promise<void>
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

function useUserContext() {
  const ctx = useContext(UserContext)
  if (!ctx) {
    throw new Error('useUserContext must be used within UserContext.Provider')
  }
  return ctx
}

export type { UserSummary, UserContextValue }
export { UserContext, useUserContext }
