import { type LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/react'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server'

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUserId(request)

  const bandId = params.bandId

  const songCount = await prisma.song.count({
    where: {
      bandSongs: {
        every: {
          bandId,
        },
      },
    },
  })

  const songs = await prisma.bandSong.findMany({
    where: {
      bandId,
    },
    select: {
      song: {
        select: {
          id: true,
          title: true,
          artist: true,
          status: true,
          rating: true,
          youtubeUrl: true,
          lyrics: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  })

  return json({ songs: songs.map(song => ({ ...song.song, lyricId: song?.song?.lyrics?.id || '' })), songCount })
}
