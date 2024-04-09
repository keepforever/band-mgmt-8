import { useNavigate } from '@remix-run/react'
import React from 'react'

type BandSummaryProps = {
  id: string
  name: string
  memberCount: number
  upcomingEventsCount: number
}

export const BandSummary: React.FC<BandSummaryProps> = ({ name, memberCount, upcomingEventsCount, id }) => {
  const navigate = useNavigate()
  return (
    <div className="max-w-sm overflow-hidden rounded bg-background shadow-md" onClick={() => navigate(`/bands/${id}`)}>
      <div className="px-6 py-4">
        <div className="mb-2 text-xl font-bold">{name}</div>
      </div>
      <div className="px-6 pb-2 pt-4">
        <span className="mb-2 mr-2 inline-block rounded-full bg-accent px-3 py-1 text-sm font-semibold text-foreground">
          Members: {memberCount}
        </span>
        <span className="mb-2 mr-2 inline-block rounded-full bg-accent px-3 py-1 text-sm font-semibold text-foreground">
          Upcoming Events: {upcomingEventsCount}
        </span>
      </div>
    </div>
  )
}
