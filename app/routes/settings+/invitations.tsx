import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, json, useLoaderData } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'

// Loader function to fetch invitations
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

  invariantResponse(invitationId, 'Invitation ID is required')
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
      <div className="flex w-full flex-col items-center justify-center rounded border border-gray-200 p-12">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {invitations.map((invitation, index) => (
          <div key={index} className="flex flex-col rounded border p-4 shadow">
            <h2 className="text-xl font-bold">Invitation to {invitation.band.name}</h2>
            <p className="mb-2 text-gray-500">ID: {invitation.id}</p>

            {invitation.invitee && (
              <p className="mb-2 text-gray-500">
                Invitee: {invitation.invitee.name} - {invitation.invitee.email}
              </p>
            )}
            <p className="mb-2 text-gray-500">Sent: {new Date(invitation.createdAt).toLocaleDateString()}</p>
            <p className="mb-2 text-gray-500">Status: {invitation.status}</p>

            <Form className="flex justify-end" method="post">
              <input type="hidden" name="invitationId" value={invitation.id} />
              <Button type="submit" variant="default">
                Accept
              </Button>
            </Form>
          </div>
        ))}
      </div>
    </div>
  )
}
