import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData } from '@remix-run/react'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { InvitationsEmptyState } from '#app/components/invitations-empty-state.js'
import { Button } from '#app/components/ui/button'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server'

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUserId(request)
  await requireUserBelongToBand(request, params)
  const bandId = params.bandId
  const invitations = await prisma.invitation.findMany({
    where: {
      bandId: bandId,
    },
    select: {
      id: true,
      createdAt: true,
      invitee: {
        select: {
          email: true,
          name: true,
        },
      },
      band: {
        select: {
          name: true,
        },
      },
    },
  })
  return json({ invitations })
}

export default function BandIdIndex() {
  const { invitations } = useLoaderData<typeof loader>()

  if (invitations.length === 0) {
    return <InvitationsEmptyState />
  }

  return (
    <>
      <HeaderWithActions title="Invitations">
        <Button asChild variant="secondary" size="lg">
          <Link to="new">Send Invitation</Link>
        </Button>
      </HeaderWithActions>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {invitations.map((invitation, index) => (
          <div key={index} className="col-span-1 flex flex-col gap-1.5 rounded border bg-muted p-4 shadow">
            <h2 className="text-body-md font-bold">Invitation to {invitation.band.name}</h2>

            {invitation.invitee && (
              <p className="">
                Invitee: {invitation.invitee.name} - {invitation.invitee.email}
              </p>
            )}
            <p className="text-muted-foreground">Sent: {new Date(invitation.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </>
  )
}
