import { useState } from 'react'

import { useUserContext } from './UserContext'

type SearchBarProps = {
  onSearch: (username: string) => void
}

function SearchBar({ onSearch }: SearchBarProps) {
  const { users } = useUserContext()
  const [value, setValue] = useState('')

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search users"
        className="w-40 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        list="user-search-list"
      />
      <datalist id="user-search-list">
        {users
          .filter((user) => typeof user.username === 'string' && user.username.trim().length > 0)
          .map((user) => (
            <option key={user.username} value={user.username} />
          ))}
      </datalist>
      <button
        onClick={() => value.trim() && onSearch(value.trim())}
        className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800"
      >
        Go
      </button>
    </div>
  )
}

export { SearchBar }
