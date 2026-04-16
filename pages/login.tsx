import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'

import { useUserContext } from '../components/UserContext'

type AuthMode = 'login' | 'register'

const LoginPage: NextPage = () => {
  const router = useRouter()
  const { loginUser, registerUser, continueWithGoogle } = useUserContext()

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

  async function handleGoogleContinue() {
    const email = typeof window !== 'undefined' ? window.prompt('Enter your Google email') : null
    const cleanedEmail = (email ?? '').trim().toLowerCase()

    if (!cleanedEmail) {
      return
    }

    if (!cleanedEmail.includes('@')) {
      setErrorMessage('Enter a valid Google email address.')
      return
    }

    setErrorMessage('')
    setSubmitting(true)

    try {
      await continueWithGoogle(cleanedEmail)
      await router.push('/')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to continue with Google')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_20%,#dbeafe_0%,#eff6ff_26%,#f8fafc_54%,#e2e8f0_100%)] px-4 py-10">
      <div className="pointer-events-none absolute -left-20 top-16 h-64 w-64 rounded-full bg-sky-300/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" aria-hidden />
      <div className="mx-auto flex min-h-[92vh] max-w-xl items-center justify-center">
      <Head>
        <title>Sign In | MiniSocial</title>
      </Head>

      <section className="relative w-full rounded-3xl border border-slate-200/70 bg-white/90 p-7 shadow-[0_26px_90px_rgba(15,23,42,0.14)] backdrop-blur md:p-8">
        <div className="space-y-5">
          <div>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-sky-200">
              M
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">MiniSocial</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'login'
                ? 'Log in to continue chatting, sharing, and exploring your network.'
                : 'Join the community and start building your social graph.'}
            </p>
          </div>

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

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleGoogleContinue().catch((error) => console.error(error))}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {submitting ? 'Please wait...' : 'Continue with Google'}
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Continue with Apple
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or with username
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {mode === 'login' ? (
            <form onSubmit={(event) => handleLogin(event).catch((error) => console.error(error))} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
                <input
                  value={loginUsername}
                  onChange={(event) => setLoginUsername(event.target.value)}
                  placeholder="your_username"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-500">
                  <input type="checkbox" className="rounded border-slate-300" />
                  Keep me signed in
                </label>
                <button type="button" className="font-semibold text-sky-700 hover:text-sky-800">
                  Forgot password?
                </button>
              </div>

              {errorMessage ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{errorMessage}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:from-slate-800 hover:to-slate-700 disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>

              <p className="text-center text-xs text-slate-500">
                No account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register')
                    setErrorMessage('')
                  }}
                  className="font-semibold text-sky-700 hover:text-sky-800"
                >
                  Register now
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={(event) => handleRegister(event).catch((error) => console.error(error))} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
                <input
                  value={registerUsername}
                  onChange={(event) => setRegisterUsername(event.target.value)}
                  placeholder="choose_a_username"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              {errorMessage ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{errorMessage}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-sky-700 hover:to-cyan-600 disabled:opacity-60"
              >
                {submitting ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="text-center text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setErrorMessage('')
                  }}
                  className="font-semibold text-sky-700 hover:text-sky-800"
                >
                  Login
                </button>
              </p>
            </form>
          )}
        </div>
      </section>
      </div>
    </div>
  )
}

export default LoginPage
