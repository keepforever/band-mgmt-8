import { Link, useParams } from '@remix-run/react'
import React from 'react'
import { Icon } from '#app/components/ui/icon.js'
import { cn } from '#app/utils/misc.js'
import { Button } from './ui/button'

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
            className={cn('rounded-full px-2 py-1 text-xs font-medium', {
              'bg-status-success text-status-success-foreground': status === 'Admin',
              'bg-status-primary text-status-primary-foreground': status !== 'Admin',
            })}
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

interface BandMemberPlaceholderCardProps {}

export const BandMemberPlaceholderCard: React.FC<BandMemberPlaceholderCardProps> = () => {
  const params = useParams()
  const { bandId } = params

  return (
    <Link
      to={`/bands/${bandId}/invitations/new`}
      className="rounded-lg bg-muted shadow-md transition-shadow duration-300 hover:bg-muted/80 hover:shadow-lg"
    >
      <div className="p-4">
        <Button variant="ghost">Add Member</Button>

        <div className="mt-4 flex items-center justify-end">
          <div className="flex items-center space-x-2">
            <Icon name="plus" className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </Link>
  )
}
