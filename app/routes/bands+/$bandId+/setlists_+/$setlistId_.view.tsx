import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, json, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, Link, redirect, useLoaderData, useParams } from '@remix-run/react'
import { DownloadCSVButton } from '#app/components/download-csv-button.js'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { cn, formatDate } from '#app/utils/misc.js'

const prepareCSVData = (setlist: any): string[][] => {
  const eventDetails = [
    ...(setlist?.event?.name ? [[`eventname`, setlist.event.name]] : []),
    ...(setlist?.event?.venue?.name ? [[`venueName`, setlist.event.venue.name]] : []),
    ...(setlist?.event?.location ? [[`location`, setlist.event.location]] : []),
    ...(setlist?.event?.date ? [[`date`, formatDate(setlist.event.date)]] : []),
  ]

  const setNames: string[] = setlist.sets.map((_: any, index: number) => `Set ${index + 1}`)
  const songsInSets: string[][] = setlist.sets.map((set: any) => set.setSongs.map((song: any) => song.song.title))

  const maxLength = Math.max(...songsInSets.map(set => set.length))
  const songsRows: string[][] = Array.from({ length: maxLength }, () => Array(setlist.sets.length).fill(''))

  songsInSets.forEach((set, i) => {
    set.forEach((song, j) => {
      songsRows[j][i] = song
    })
  })

  return [...eventDetails, setNames, ...songsRows]
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request)

  const setlistId = params.setlistId

  const setlist = await prisma.setlist.findUnique({
    where: {
      id: setlistId,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      events: {
        select: {
          name: true,
          location: true,
          date: true,
          venue: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      sets: {
        include: {
          setSongs: {
            include: {
              song: {
                select: {
                  id: true,
                  title: true,
                  artist: true,
                  rating: true,
                  status: true,
                  lyrics: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  invariantResponse(setlist, 'Setlist not found')

  return json({ setlist } as const)
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUserId(request)

  const bandId = params.bandId
  const setlistId = params.setlistId

  invariantResponse(bandId, 'Band ID is required')
  invariantResponse(setlistId, 'Setlist ID is required')

  const setlist = await prisma.setlist.findUnique({
    where: {
      id: setlistId,
    },
    select: {
      sets: {
        select: {
          setlistId: true,
          id: true,
        },
      },
    },
  })

  await prisma.$transaction(async transactionPrisma => {
    const setIdArray = setlist?.sets.map(set => set.id)

    await transactionPrisma.setSong.deleteMany({
      where: {
        setId: {
          in: setIdArray,
        },
      },
    })

    await transactionPrisma.set.deleteMany({
      where: {
        setlistId: setlistId,
      },
    })

    await transactionPrisma.bandSetlist.deleteMany({
      where: {
        setlistId: setlistId,
      },
    })

    await transactionPrisma.setlist.delete({
      where: {
        id: setlistId,
      },
    })
  })

  return redirect(`/bands/${bandId}/setlists`)
}

export default function CreateSetlistRoute() {
  const { setlist } = useLoaderData<typeof loader>()
  const params = useParams()
  const csvData = prepareCSVData(setlist)

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-4 flex flex-wrap-reverse sm:flex-wrap sm:justify-between">
        <h1 className="mb-4 text-2xl font-bold">{setlist.name}</h1>

        <div className="flex items-end gap-3 sm:items-start">
          <Link relative="path" to="../edit">
            <Button size="sm">Edit</Button>
          </Link>

          <DownloadCSVButton
            data={csvData}
            filename={`${setlist?.events?.[0]?.name} - ${setlist?.events?.[0]?.date}`}
          />

          <Form method="post">
            <Button size="sm" variant="destructive">
              Delete
            </Button>
          </Form>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {setlist.sets.map((set, setIndex) => (
          <div key={set.id} className="rounded border border-foreground p-4 shadow">
            <h2 className="mb-4 text-center text-xl font-bold text-accent-two outline outline-accent-two">
              Set {setIndex + 1}
            </h2>
            <ul>
              {set.setSongs
                .sort((a, b) => a.order - b.order)
                .map(setSong => (
                  <li key={setSong.song.id} className="mb-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <Link to={`/bands/${params.bandId}/songs/${setSong.song.id}/view`}>
                          <span className="text-sm font-bold text-primary hover:underline">{setSong.song.title}</span>
                        </Link>
                        <Link
                          to={`/bands/${params?.bandId}/songs/${setSong.song.id}/lyrics`}
                          className={cn('flex items-center text-muted-foreground', {
                            hidden: !setSong.song.lyrics?.id,
                          })}
                        >
                          <Icon name="file-text" className="fill-lime-400" />
                        </Link>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-accent-two">{setSong.song.artist}</span>
                        {setSong.song.rating && (
                          <div className="inline-flex items-center justify-center rounded-full bg-destructive px-1 text-xs text-accent-two">
                            {setSong.song.rating}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Events */}

      {setlist.events.length > 0 && (
        <>
          <h2 className="text-h5">Events</h2>

          <div className="flex flex-wrap items-center gap-2">
            {setlist?.events?.map(event => {
              return (
                <div className="flex flex-col border-2 border-foreground px-2 py-1" key={event.name}>
                  <span className="text-xl font-bold text-accent-two">{event?.name}</span>
                  <Link
                    to={`/bands/${params.bandId}/venues/${event?.venue?.id}/view`}
                    className="flex items-center gap-1 hover:text-accent-two hover:underline"
                  >
                    <div className="flex gap-1">
                      <span>{event?.venue?.name}</span>, <span>{event?.location}</span>
                    </div>
                  </Link>
                  <span className="text-foreground">{formatDate(event?.date || '')}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
