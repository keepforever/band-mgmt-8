import { invariantResponse } from '@epic-web/invariant'
import { type Song } from '@prisma/client'
import { redirect, type ActionFunctionArgs } from '@remix-run/node'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request)
  const bandId = params.bandId
  invariantResponse(userId, 'You must be logged in to create a setlist')

  const formData = await request.formData()
  const setlistName = formData.get('name') as string
  const eventId = formData.get('event') as string

  // Dynamically parse sets
  const setsData = []
  for (const [key, value] of formData) {
    if (key.startsWith('set')) {
      const songs = JSON.parse(value as string) as Song[]
      setsData.push({
        name: `Set ${parseInt(key.replace('set', '')) + 1}`,
        songs,
      })
    }
  }
  // Prepare data for Prisma
  const createSetsData = setsData.map((set, index) => ({
    name: set.name,
    order: index + 1,
    setSongs: {
      create: set.songs.map((song, songIndex) => ({
        songId: song.id,
        order: songIndex + 1,
      })),
    },
  }))

  const createSetlistPayload = {
    data: {
      name: setlistName,
      BandSetlist: {
        create: {
          bandId: bandId as string,
        },
      },
      sets: {
        create: createSetsData,
      },
      ...(eventId && {
        events: {
          connect: {
            id: eventId,
          },
        },
      }),
    },
  }

  await prisma.setlist.create(createSetlistPayload)
  return redirect(`/bands/${bandId}/setlists`)
}
