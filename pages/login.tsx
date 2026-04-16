import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'

import { useUserContext } from '../components/UserContext'

type AuthMode = 'login' | 'register'

const LoginPage: NextPage = () => {
  const router = useRouter()
  const { loginUser, registerUser } = useUserContext()

  const [mode, setMode] = useState<AuthMode>('login')
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const username = loginUsername.trim().toLowerCase()
    const password = loginPassword

    if (!username || !password) {
      setErrorMessage('Enter username and password.')
      return
    }

    setErrorMessage('')
    setSubmitting(true)

    try {
      await loginUser(username, password)
      await router.push('/')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to login')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const username = registerUsername.trim().toLowerCase()
    const password = registerPassword

    if (!username || !password) {
      setErrorMessage('Enter username and password.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setErrorMessage('')
    setSubmitting(true)

    try {
      await registerUser(username, password)
      await router.push('/')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to register')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[88vh] max-w-xl items-center justify-center px-4 py-8">
      <Head>
        <title>Sign In | MiniSocial</title>
      </Head>

      <section className="w-full rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,0.12)] md:p-8">
        <div className="space-y-5">
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setErrorMessage('')
              }}
              className={`rounded-lg px-3 py-2 transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setErrorMessage('')
              }}
              className={`rounded-lg px-3 py-2 transition ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Register
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={(event) => handleLogin(event).catch((error) => console.error(error))} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
                <input
                  value={loginUsername}
                  onChange={(event) => setLoginUsername(event.target.value)}
                  placeholder="your_username"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              </div>

              {errorMessage ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{errorMessage}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={(event) => handleRegister(event).catch((error) => console.error(error))} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
                <input
                  value={registerUsername}
                  onChange={(event) => setRegisterUsername(event.target.value)}
                  placeholder="choose_a_username"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              </div>

              {errorMessage ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{errorMessage}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
              >
                {submitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}

export default LoginPage
