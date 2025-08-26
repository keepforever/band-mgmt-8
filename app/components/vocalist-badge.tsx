import { getInitials, getUserColor } from '#app/utils/misc.tsx'

type VocalistBadgeProps = {
  user: { id: string; name: string | null; username: string }
  compact?: boolean
}

// Vocalist Badge Component
export const VocalistBadge = ({ user, compact = false }: VocalistBadgeProps) => {
  const displayName = user.name || user.username
  const initials = getInitials(displayName)
  const color = getUserColor(user.id)

  // Extract first name for compact mode
  const firstName = user.name ? user.name.split(' ')[0] : user.username

  if (compact) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium text-white"
        style={{ backgroundColor: color }}
        title={displayName}
      >
        {firstName}
      </span>
    )
  }

  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color }}
      title={displayName}
    >
      {initials}
    </span>
  )
}
