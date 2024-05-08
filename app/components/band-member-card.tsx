import { Link, useFetcher, useParams, useRevalidator } from '@remix-run/react'
import React from 'react'
import { Icon } from '#app/components/ui/icon.js'
import { cn } from '#app/utils/misc.js'
import { useOptionalUser } from '#app/utils/user.js'
import { Input } from './ui/input'

interface BandMemberCardProps {
  name: string
  instrument: string
  status: 'Admin' | 'Member'
  memberUserId: string
}

export const BandMemberCard: React.FC<BandMemberCardProps> = ({ name, instrument, status, memberUserId }) => {
  const [isEditing, setIsEditing] = React.useState(false)
  const user = useOptionalUser()
  const params = useParams()

  return (
    <div className="rounded-lg bg-background shadow-md transition-shadow duration-300 hover:shadow-lg">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        {isEditing ? (
          <EditMemberInstrumentForm
            bandId={String(params?.bandId)}
            userId={memberUserId}
            instrument={instrument}
            setIsEditing={setIsEditing}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            <p className="text-button text-muted-foreground">{instrument}</p>

            {memberUserId === user?.id && (
              <Icon
                onClick={() => {
                  setIsEditing(b => !b)
                }}
                name="pencil-2"
                className="h-4 w-4"
              />
            )}
          </div>
        )}

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
      <div className="flex h-full flex-col justify-between p-4">
        <h3 className="p-0 text-lg">Add Member</h3>

        <div className="mt-4 flex items-center justify-end">
          <Icon name="plus" className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </Link>
  )
}

type EditMemberInstrumentFormProps = {
  bandId: string
  userId: string
  instrument: string
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
}

const EditMemberInstrumentForm: React.FC<EditMemberInstrumentFormProps> = ({
  bandId,
  userId,
  instrument,
  setIsEditing,
}) => {
  const fetcher = useFetcher({
    key: 'update-user-band-instrument',
  })
  const isUpdating = fetcher.state !== 'idle'
  const revalidator = useRevalidator()

  React.useEffect(() => {
    if (isUpdating) {
      setIsEditing(false)
      revalidator.revalidate()
    }
  }, [isUpdating, setIsEditing, revalidator])

  return (
    <fetcher.Form method="POST" action={`/resources/user-band`}>
      <Input
        autoFocus
        type="text"
        name="instrument"
        defaultValue={instrument}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            setIsEditing(false)
          }
        }}
      />

      <input type="hidden" name="bandId" value={bandId} />
      <input type="hidden" name="userId" value={userId} />
    </fetcher.Form>
  )
}
