import { randomBytes } from 'crypto'
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

import { createPasswordSalt, hashPassword } from '../../../internals/auth'
import { createSession } from '../../../internals/database'
import { UserRepository } from '../../../repository/UserRepository'

function usernameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? ''
  const normalized = localPart.toLowerCase().replace(/[^a-z0-9_.]/g, '')
  const compact = normalized.slice(0, 20)

  if (compact.length >= 3) {
    return compact
  }

  return `user${Math.floor(Date.now() % 100000)}`
}

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const hasGoogleOAuthConfig = Boolean(googleClientId && googleClientSecret)

if (!hasGoogleOAuthConfig) {
  console.warn('Google OAuth is not fully configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.')
}

export default NextAuth({
  providers: hasGoogleOAuthConfig
    ? [
        GoogleProvider({
          clientId: googleClientId as string,
          clientSecret: googleClientSecret as string,
          authorization: {
            params: {
              prompt: 'select_account'
            }
          }
        })
      ]
    : [],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') {
        return true
      }

      const email = String(user.email ?? '').trim().toLowerCase()
      if (!email || !email.includes('@')) {
        return false
      }

      const session = createSession()
      const repo = new UserRepository(session)

      try {
        const existingGoogle = await repo.findUserByGoogleEmail(email)
        if (existingGoogle.records.length > 0) {
          const username = String(existingGoogle.records[0].get('username') ?? '')
          user.name = username
          return true
        }

        const baseUsername = usernameFromEmail(email)
        let selectedUsername = baseUsername

        for (let attempt = 0; attempt < 50; attempt += 1) {
          const candidate = attempt === 0 ? baseUsername : `${baseUsername.slice(0, 16)}${attempt}`
          const check = await repo.findUserByUsername(candidate)

          if (!check.records.length) {
            selectedUsername = candidate
            break
          }

          const existingEmail = String(check.records[0].get('googleEmail') ?? '')
          if (existingEmail === email) {
            selectedUsername = candidate
            break
          }
        }

        const randomPassword = randomBytes(24).toString('hex')
        const salt = createPasswordSalt()
        const passwordHash = hashPassword(randomPassword, salt)
        await repo.addGoogleUser(selectedUsername, email, passwordHash, salt)

        user.name = selectedUsername
        return true
      } catch (error) {
        console.error(error)
        return false
      } finally {
        await session.close()
      }
    },
    async jwt({ token, user }) {
      if (user?.name) {
        token.username = user.name
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && typeof token.username === 'string') {
        session.user.name = token.username
      }

      return session
    }
  },
  pages: {
    signIn: '/login'
  }
})
