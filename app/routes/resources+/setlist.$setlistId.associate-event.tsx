import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, json } from '@remix-run/node'

import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

// `/resources+/${setlist.$setlistId}/associate-event`
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const userId = await requireUserId(request)
  invariantResponse(userId, 'You must be logged in to create a song')

  const formData = await request.formData()

  const eventId = formData.get('eventId')
  invariantResponse(eventId, 'Event is required', { status: 404 })

  const setlistId = params.setlistId
  invariantResponse(setlistId, 'Setlist is required')

  await prisma.setlist.update({
    where: { id: setlistId },
    data: {
      events: {
        connect: { id: String(eventId) },
      },
    },
  })

  return json({ success: true })
}
