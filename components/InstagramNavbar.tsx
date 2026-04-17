import Link from 'next/link'
import { useRouter } from 'next/router'

import { SearchBar } from './SearchBar'
import { useUserContext } from './UserContext'

function InstagramNavbar() {
  const router = useRouter()
  const { currentUser, logout } = useUserContext()

  const navItems = [
    {
      href: '/',
      label: 'Feed',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
          <path d="M4 11.5 12 5l8 6.5" />
          <path d="M6.5 10.5V20h11V10.5" />
        </svg>
      )
    },
    {
      href: '/create-post',
      label: 'Create',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      )
    },
    {
      href: '/chat',
      label: 'Chat',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
          <path d="M5 6.5h14v9H10l-4.5 3V6.5Z" />
        </svg>
      )
    },
    {
      href: '/notifications',
      label: 'Alerts',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
          <path d="M12 5a4 4 0 0 0-4 4v2.1c0 .8-.2 1.6-.7 2.2L6 15.2h12l-1.3-1.9c-.4-.6-.7-1.4-.7-2.2V9a4 4 0 0 0-4-4Z" />
          <path d="M10.8 18a1.2 1.2 0 0 0 2.4 0" />
        </svg>
      )
    }
  ]

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
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
              onClick={logout}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-3 md:hidden">
          <SearchBar onSearch={(username) => router.push(`/profile/${encodeURIComponent(username)}`).catch((error) => console.error(error))} />
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-1.5 backdrop-blur">
        <div className="mx-auto grid w-full max-w-lg grid-cols-4 gap-1">
          {navItems.map((item) => {
            const active = item.href === '/' ? router.pathname === '/' : router.pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center rounded-xl px-2 py-1.5 text-[11px] font-semibold transition ${
                  active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span className="mt-1 leading-none">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

export { InstagramNavbar }
