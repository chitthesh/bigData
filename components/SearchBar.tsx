import { useState } from 'react'

import { useUserContext } from './UserContext'

type SearchBarProps = {
  onSearch: (username: string) => void
}

function SearchBar({ onSearch }: SearchBarProps) {
  const { users } = useUserContext()
  const [value, setValue] = useState('')

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (value.trim()) {
          onSearch(value.trim())
        }
      }}
      className="group flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 shadow-sm transition focus-within:border-blue-300 focus-within:bg-white"
    >
      <span className="text-slate-400 transition group-focus-within:text-blue-500" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M10 3a7 7 0 1 0 4.39 12.45l4.58 4.58 1.42-1.42-4.58-4.58A7 7 0 0 0 10 3Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" />
        </svg>
      </span>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search accounts"
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
      <button type="submit" className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800">
        Search
      </button>
    </form>
  )
}

export { SearchBar }
