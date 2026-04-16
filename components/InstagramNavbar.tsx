import Link from 'next/link'
import { useRouter } from 'next/router'

import { SearchBar } from './SearchBar'
import { useUserContext } from './UserContext'

type InstagramNavbarProps = {
  onCreateUser: () => Promise<void>
  creating: boolean
}

function InstagramNavbar({ onCreateUser, creating }: InstagramNavbarProps) {
  const router = useRouter()
  const { currentUser, logout } = useUserContext()

  const navItems = [
    { href: '/', label: 'Feed' },
    { href: '/create-post', label: 'Create' },
    { href: '/chat', label: 'Chat' },
    { href: '/notifications', label: 'Alerts' }
  ]

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-slate-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-rose-500 to-orange-400 text-sm font-bold text-white">
            M
          </span>
          <span className="text-lg font-bold tracking-tight">MiniSocial</span>
        </Link>

        <div className="hidden lg:block">
          <SearchBar onSearch={(username) => router.push(`/profile/${encodeURIComponent(username)}`).catch((error) => console.error(error))} />
        </div>

        <nav className="ml-2 hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const active = item.href === '/' ? router.pathname === '/' : router.pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {currentUser ? (
            <Link
              href={`/profile/${encodeURIComponent(currentUser)}`}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            >
              @{currentUser}
            </Link>
          ) : null}

          <button
            onClick={() => onCreateUser().catch((error) => console.error(error))}
            disabled={creating}
            className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {creating ? 'Adding...' : 'Add User'}
          </button>

          <button
            onClick={logout}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 md:hidden">
        <SearchBar onSearch={(username) => router.push(`/profile/${encodeURIComponent(username)}`).catch((error) => console.error(error))} />
        {navItems.map((item) => {
          const active = item.href === '/' ? router.pathname === '/' : router.pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}

export { InstagramNavbar }
