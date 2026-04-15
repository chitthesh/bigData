import Link from 'next/link'
import { useRouter } from 'next/router'

import { useUserContext } from './UserContext'

function InstagramSidebar() {
  const router = useRouter()
  const { currentUser, users } = useUserContext()

  const links = [
    { href: '/', label: 'Home Feed' },
    { href: '/create-post', label: 'Create Post' },
    { href: '/chat', label: 'Messages' },
    { href: '/notifications', label: 'Notifications' }
  ]

  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-28 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500 via-rose-500 to-orange-400 p-4 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/80">Social Dashboard</p>
          <p className="mt-1 text-sm font-semibold">Create, chat, and grow your network.</p>
        </div>

        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Navigation</p>
        <div className="space-y-2">
          {links.map((item) => {
            const active = item.href === '/' ? router.pathname === '/' : router.pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-2 text-sm font-medium ${
                  active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
          {currentUser ? (
            <Link
              href={`/profile/${encodeURIComponent(currentUser)}`}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              My Profile
            </Link>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Suggested Accounts</p>
          <div className="mt-2 max-h-64 space-y-2 overflow-auto pr-1">
            {users.map((user) => (
              <Link
                key={user.username}
                href={`/profile/${encodeURIComponent(user.username)}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-white"
              >
                <span>@{user.username}</span>
                <span className="text-[11px] font-semibold text-fuchsia-600">View</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

export { InstagramSidebar }
