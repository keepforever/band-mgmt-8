import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request)
  await requireUserBelongToBand(request, params)
  const clonedSetlistId = new URL(request.url).searchParams.get('clonedSetlistId')

  let clonedSetlist

  if (clonedSetlistId) {
    clonedSetlist = await prisma.setlist.findUnique({
      where: {
        id: clonedSetlistId,
      },
      select: {
        name: true,
        events: {
          select: {
            id: true,
          },
        },
        sets: {
          select: {
            name: true,
            order: true,
            setSongs: {
              select: {
                order: true,
                song: {
                  select: {
                    id: true,
                    title: true,
                    artist: true,
                  },
                },
              },
            },
          },
        },
      },
    })
  }

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
      status: 'ready',
    },
  })

  console.log(`
  #########################################################
                  songs
  #########################################################
  `)

  console.log('\n', '\n', `songs = `, songs, '\n', '\n')

  console.log(`
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  #########################################################
  `)

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

  return json({ songs, events, bandId: params.bandId, clonedSetlist } as const)
}
