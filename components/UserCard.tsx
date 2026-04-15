type UserCardProps = {
  username: string
  subtitle?: string
  isFriend?: boolean
  connections?: number
  onAdd?: () => void
  onRemove?: () => void
  onView?: () => void
}

function UserCard({ username, subtitle, isFriend, connections, onAdd, onRemove, onView }: UserCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">@{username}</h3>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
          {typeof connections === 'number' ? (
            <p className="mt-1 text-xs text-slate-400">Connections: {connections}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          {onView ? (
            <button
              onClick={onView}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              View
            </button>
          ) : null}
          {isFriend && onRemove ? (
            <button
              onClick={onRemove}
              className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-600"
            >
              Remove Friend
            </button>
          ) : null}
          {!isFriend && onAdd ? (
            <button
              onClick={onAdd}
              className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              Add Friend
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export { UserCard }
