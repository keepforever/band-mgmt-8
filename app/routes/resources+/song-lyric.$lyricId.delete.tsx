import { invariantResponse } from '@epic-web/invariant'
import { json, type ActionFunctionArgs } from '@remix-run/node'

import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const userId = await requireUserId(request)
  invariantResponse(userId, 'You must be logged in to delete a song')

  if (params.lyricId) {
    await prisma.songLyrics.delete({
      where: { id: params.lyricId },
    })
  } else {
    throw new Error('Lyric ID is required to delete a song lyric')
  }

  // const redirectPath = '/your-redirect-path'
  return json({ success: true })
}
