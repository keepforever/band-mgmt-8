import { type LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/react'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server'

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUserId(request)
  await requireUserBelongToBand(request, params)

  const url = new URL(request.url)
  const q = url.searchParams.get('q')
  const status = url.searchParams.get('status')
  const sortBy = url.searchParams.get('sortBy') || 'title'
  const sortOrder = url.searchParams.get('sortOrder') || 'asc'
  const bandId = params.bandId

  const filterByQuery = q
    ? {
        OR: [
          {
            title: {
              contains: q.toLowerCase(),
            },
          },
          {
            artist: {
              contains: q.toLowerCase(),
            },
          },
        ],
      }
    : {}

  const filterByStatus = status
    ? {
        status: {
          equals: status,
        },
      }
    : {}

  const songCount = await prisma.song.count({
    where: {
      bandSongs: {
        every: {
          bandId,
        },
      },
      ...filterByQuery,
      ...filterByStatus,
    },
  })

  const bandSongFilterByQuery = q
    ? {
        OR: [
          {
            song: {
              title: {
                contains: q?.toLowerCase(),
              },
            },
          },
          {
            song: {
              artist: {
                contains: q?.toLowerCase(),
              },
            },
          },
        ],
      }
    : {}

  const songs = await prisma.bandSong.findMany({
    where: {
      bandId,
      ...bandSongFilterByQuery,
      song: {
        ...filterByStatus,
      },
    },
    orderBy: {
      song: {
        [sortBy]: sortOrder,
      },
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
          _count: {
            select: {
              SetSong: true,
            },
          },
        },
      },
    },
  })

  return json({
    songs: songs.map(song => ({
      ...song.song,
      lyricId: song?.song?.lyrics?.id || '',
      setSongCount: song.song._count.SetSong,
    })),
    songCount,
  })
}
