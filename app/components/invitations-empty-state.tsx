import { Link, useParams } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { CardContent, Card } from '#app/components/ui/card'
import { Icon } from './ui/icon'

export function InvitationsEmptyState() {
  const { bandId } = useParams()
  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardContent className="flex flex-col items-center gap-4 p-10">
        <Icon name="pope" className="h-40 w-40 fill-red-400 text-gray-400 dark:text-gray-500" />

        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold">This band has no pending invitations</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Invite someone to join this band by sending them an invitation.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Only admins can send invitations.</p>
        </div>

        <div className="flex w-full">
          <Link className="w-full" to={`/bands/${bandId}/invitations/new`}>
            <Button className="w-full">Send Invitation</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
