import { type Prisma } from '@prisma/client'
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
  const sortDirection = (url.searchParams.get('sortDirection') || 'asc') as Prisma.SortOrder

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
    orderBy:
      sortBy === 'setSongCount'
        ? {
            song: {
              SetSong: {
                _count: sortDirection,
              },
            },
          }
        : sortBy === 'vocalist'
          ? undefined // We'll handle vocalist sorting manually
          : {
              song: {
                [sortBy]: sortDirection,
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
      vocalists: {
        where: {
          vocalType: 'lead',
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      },
    },
  })

  // If sorting by setSongCount or vocalist, we need to sort manually
  if (sortBy === 'setSongCount' || sortBy === 'vocalist') {
    const sortedSongs = songs.sort((a, b) => {
      if (sortBy === 'setSongCount') {
        const countA = a.song._count.SetSong
        const countB = b.song._count.SetSong
        return sortDirection === 'asc' ? countA - countB : countB - countA
      }

      if (sortBy === 'vocalist') {
        // Get the first vocalist's name (or empty string if no vocalist)
        const vocalistA = a.vocalists[0]?.user?.name || a.vocalists[0]?.user?.username || ''
        const vocalistB = b.vocalists[0]?.user?.name || b.vocalists[0]?.user?.username || ''

        // Sort alphabetically, with empty strings at the end
        if (vocalistA === '' && vocalistB === '') return 0
        if (vocalistA === '') return 1
        if (vocalistB === '') return -1

        const comparison = vocalistA.localeCompare(vocalistB)
        return sortDirection === 'asc' ? comparison : -comparison
      }

      return 0
    })

    return json({
      songs: sortedSongs.map(song => ({
        ...song.song,
        lyricId: song?.song?.lyrics?.id || '',
        setSongCount: song.song._count.SetSong,
        vocalists: song.vocalists,
      })),
      songCount,
    })
  }

  return json({
    songs: songs.map(song => ({
      ...song.song,
      lyricId: song?.song?.lyrics?.id || '',
      setSongCount: song.song._count.SetSong,
      vocalists: song.vocalists,
    })),
    songCount,
  })
}
