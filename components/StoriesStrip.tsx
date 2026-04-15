import Link from 'next/link'

import { useUserContext } from './UserContext'

function StoriesStrip() {
  const { users } = useUserContext()

  if (!users.length) {
    return null
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-max gap-4">
        {users.slice(0, 14).map((user) => (
          <Link
            key={user.username}
            href={`/profile/${encodeURIComponent(user.username)}`}
            className="group flex w-20 flex-col items-center gap-2"
          >
            <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-rose-500 via-orange-400 to-yellow-300 p-[2px]">
              <div className="h-full w-full rounded-full bg-white" />
            </div>
            <span className="w-full truncate text-center text-xs text-slate-600 group-hover:text-slate-900">@{user.username}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export { StoriesStrip }
