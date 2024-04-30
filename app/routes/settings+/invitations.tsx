import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, json, useLoaderData } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { Card, CardHeader, CardContent } from '#app/components/ui/card.js'
import { Icon } from '#app/components/ui/icon.js'
import { Input } from '#app/components/ui/input.js'
import { Label } from '#app/components/ui/label.js'
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
        <h2 className="text-2xl text-foreground">No pending invitations</h2>
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
        {invitations.map((invitation, index) => (
          <Card key={invitation.id} className="max-w-md border-2 border-border">
            <CardHeader className="flex bg-muted">
              <div className="flex items-center gap-4">
                <Icon
                  name="envelope-closed"
                  // className="h-12 w-12 fill-foreground-destructive stroke-foreground-destructive stroke-[0.5px]"
                  className="h-12 w-12 text-secondary-foreground"
                />
                <h2 className="text-xl font-bold text-secondary-foreground">{invitation.band.name} Invites You!</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <Form method="post" className="flex flex-col gap-6">
                <p className="text-body-xs">Fill in your instrument and press Accept to join the band!</p>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-1 flex-col gap-1">
                    <Label htmlFor="instrument">Instrument</Label>
                    <Input
                      name="instrument"
                      className="flex-1"
                      id="instrument"
                      placeholder="Enter your instrument"
                      required
                    />
                  </div>
                  <Button type="submit" className="flex items-center space-x-2" variant="outline">
                    <Icon name="check" className="h-5 w-5 text-green-500" />
                    <span>Accept</span>
                  </Button>
                </div>

                <div className="flex justify-end">
                  <p className="mb-2 text-muted-foreground">
                    Sent: {new Date(invitation.createdAt).toLocaleDateString()}
                  </p>
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
