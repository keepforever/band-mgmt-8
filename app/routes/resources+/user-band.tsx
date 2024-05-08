import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, json } from '@remix-run/node'

import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  const userId = await requireUserId(request)
  invariantResponse(userId, 'You must be logged in to create a song')

  const bandId = formData.get('bandId')
  invariantResponse(typeof bandId === 'string', 'Band is required')

  const instrumentPayload = formData.get('instrument')
  invariantResponse(instrumentPayload && typeof instrumentPayload === 'string', 'Instrument is required')

  await prisma.userBand.update({
    where: {
      userId_bandId: {
        userId: userId,
        bandId: bandId,
      },
    },
    data: {
      instrument: instrumentPayload,
    },
  })

  return json({ success: true })
}
