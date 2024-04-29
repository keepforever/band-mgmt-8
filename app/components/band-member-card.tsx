import React from 'react'
import { Icon } from '#app/components/ui/icon.js'

interface BandMemberCardProps {
  name: string
  instrument: string
  status: string // admin or member
}

export const BandMemberCard: React.FC<BandMemberCardProps> = ({ name, instrument, status }) => {
  return (
    <div className="rounded-lg bg-background shadow-md transition-shadow duration-300 hover:shadow-lg">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        <p className="text-button text-muted-foreground">{instrument}</p>

        <div className="mt-4 flex items-center justify-between">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${status === 'Admin' ? 'bg-status-success text-status-success-foreground' : 'bg-status-primary text-status-primary-foreground'}`}
          >
            {status}
          </span>
          <div className="flex items-center space-x-2">
            <Icon name="avatar" className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}
