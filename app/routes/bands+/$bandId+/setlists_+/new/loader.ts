import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request)

  const songs = await prisma.song.findMany({
    select: {
      id: true,
      title: true,
      artist: true,
    },
    where: {
      bandSongs: {
        some: {
          bandId: params.bandId,
        },
      },
    },
  })

  const events = await prisma.event.findMany({
    where: {
      bands: {
        some: {
          bandId: params.bandId, // only show events for this band
        },
      },
      setlistId: null, // only show events that do not yet have a setlist
    },
    select: {
      id: true,
      name: true,
      date: true,
    },
  })

  function shuffleArray(array: any) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
  }

  shuffleArray(songs)

  return json({ songs, events, bandId: params.bandId } as const)
}
