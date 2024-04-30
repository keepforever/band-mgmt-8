import { Link, useParams } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { CardContent, Card } from '#app/components/ui/card'
import { Icon } from './ui/icon'

export function InvitationsEmptyState() {
  const { bandId } = useParams()
  return (
    <Card className="mx-auto w-full max-w-lg bg-muted text-muted-foreground">
      <CardContent className="flex flex-col items-center gap-4 p-10">
        <Icon name="rocket" className="h-40 w-40 fill-muted-foreground" />

        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">This band has no pending invitations</h2>
          <p className="text-sm text-muted-foreground">
            Invite someone to join this band by sending them an invitation.
          </p>
          <p className="text-sm text-muted-foreground">Only admins can send invitations.</p>
        </div>

        <div className="flex w-full">
          <Link className="w-full" to={`/bands/${bandId}/invitations/new`}>
            <Button variant="secondary" className="w-full">
              Send Invitation
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
