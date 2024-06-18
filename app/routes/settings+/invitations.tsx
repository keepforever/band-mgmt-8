import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, json, useLoaderData } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { Card, CardHeader, CardContent } from '#app/components/ui/card.js'
import { Icon } from '#app/components/ui/icon.js'
import { Input } from '#app/components/ui/input.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)

  const invitations = await prisma.invitation.findMany({
    where: {
      inviteeId: userId,
    },
    select: {
      inviterId: true,
      id: true,
      status: true,
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

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request)
  const formData = new URLSearchParams(await request.text())
  const invitationId = formData.get('invitationId')
  const instrument = formData.get('instrument')

  invariantResponse(invitationId, 'Invitation ID is required')
  invariantResponse(instrument, 'Instrument is required')
  invariantResponse(userId, 'You must be logged in to accept an invitation')

  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      inviteeId: userId,
    },
  })

  invariantResponse(!!invitation, 'Invitation not found')

  await prisma.band.update({
    where: {
      id: invitation.bandId,
    },
    data: {
      members: {
        create: [
          {
            userId,
            instrument,
          },
        ],
      },
    },
  })

  await prisma.invitation.delete({
    where: {
      id: invitationId,
    },
  })

  return json({ success: true })
}

export default function BandIdIndex() {
  const { invitations } = useLoaderData<typeof loader>()

  if (invitations.length === 0) {
    return (
      <div className="flex w-full max-w-3xl flex-col items-center justify-center rounded border border-accent-foreground p-12">
        <h2 className="text-body-lg text-foreground">No pending invitations</h2>
        <p className="text-destructive">You have no pending invitations at this time.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="my-4 text-3xl font-bold">Invitations</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {invitations.map(invitation => (
          <Card key={invitation.id} className="max-w-md border-2 border-border shadow-lg">
            <CardHeader className="flex items-center gap-2 rounded-t-lg bg-accent p-4">
              {/* <div className="flex flex-wrap items-center gap-2">
                <span className="text-right text-sm font-semibold text-muted-foreground">
                Received: {new Date(invitation.createdAt).toLocaleDateString()}
                </span>
                </div> */}

              <div className="flex flex-wrap items-center gap-2">
                <Icon name="envelope-closed" className="h-12 w-12 text-secondary-foreground" />
                <h2 className="text-xl font-bold text-secondary-foreground">{invitation.band.name} Invites You!</h2>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-6">
              <Form method="post" className="space-y-4">
                <p className="text-sm">Fill in your instrument and press Accept to join the band!</p>

                <div className="space-y-1">
                  {/* <Label htmlFor="instrument">Instrument</Label> */}
                  <Input
                    name="instrument"
                    id="instrument"
                    placeholder="Enter your instrument"
                    required
                    className="w-full"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="flex items-center space-x-2" variant="outline">
                    <Icon name="check" className="h-5 w-5 text-green-500" />
                    <span>Accept</span>
                  </Button>
                </div>

                <input type="hidden" name="invitationId" value={invitation.id} />
              </Form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
