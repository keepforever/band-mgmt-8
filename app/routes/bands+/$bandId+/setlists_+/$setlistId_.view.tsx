import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, json, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, Link, redirect, useFetcher, useLoaderData, useParams, useSearchParams } from '@remix-run/react'
import { DownloadCSVButton } from '#app/components/download-csv-button.js'
import { GeneralErrorBoundary } from '#app/components/error-boundary.js'
import { Button } from '#app/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from '#app/components/ui/dropdown-menu.js'
import { Icon } from '#app/components/ui/icon.js'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { cn, formatDate, useDoubleCheck } from '#app/utils/misc.js'

const prepareCSVData = (setlist: any, unusedBandSongs: any[]): string[][] => {
  const eventDetails = [
    ...(setlist?.event?.name ? [[`eventname`, setlist.event.name]] : []),
    ...(setlist?.event?.venue?.name ? [[`venueName`, setlist.event.venue.name]] : []),
    ...(setlist?.event?.location ? [[`location`, setlist.event.location]] : []),
    ...(setlist?.event?.date ? [[`date`, formatDate(setlist.event.date)]] : []),
  ]

  const setNames: string[] = [...setlist.sets.map((_: any, index: number) => `Set ${index + 1}`), 'Unused Songs']

  const songsInSets: string[][] = [
    ...setlist.sets.map((set: any) =>
      set.setSongs.sort((a: any, b: any) => a.order - b.order).map((song: any) => song.song.title),
    ),
    unusedBandSongs.map((song: any) => song.song.title),
  ]

  const maxLength = Math.max(...songsInSets.map(set => set.length))
  const songsRows: string[][] = Array.from({ length: maxLength }, () => Array(setlist.sets.length + 1).fill(''))

  songsInSets.forEach((set, i) => {
    set.forEach((song, j) => {
      songsRows[j][i] = song
    })
  })

  return [...eventDetails, setNames, ...songsRows]
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request)
  await requireUserBelongToBand(request, params)

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
          id: true,
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
                  youtubeUrl: true,
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

  // fetch bandSongs not in setlist
  const unusedBandSongs = await prisma.bandSong.findMany({
    where: {
      bandId: params.bandId,
      NOT: {
        songId: {
          in: setlist?.sets.flatMap(set => set.setSongs.map(setSong => setSong.song.id)),
        },
      },
    },
    select: {
      song: {
        select: {
          id: true,
          title: true,
          artist: true,
          rating: true,
          status: true,
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

  const assignedEventIds = setlist?.events.map(event => event?.id)

  const events = await prisma.event.findMany({
    where: {
      AND: [
        {
          bands: {
            some: {
              bandId: params.bandId,
            },
          },
        },
        {
          NOT: {
            id: {
              in: assignedEventIds, // Filter out these IDs
            },
          },
          // we don't want to associate the setlist with an event that already has a setlist so filter out those events
          setlistId: null,
        },
      ],
    },
    select: {
      id: true,
      name: true,
      date: true,
      setlistId: true,
      setlist: {
        select: {
          id: true,
        },
      },
    },
  })

  invariantResponse(setlist, 'Setlist not found')

  return json({ setlist, events, unusedBandSongs } as const)
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUserId(request)
  await requireUserBelongToBand(request, params)

  const formData = await request.formData()
  const intent = formData.get('intent')

  switch (intent) {
    case 'deleteSetlist': {
      const setlistId = params.setlistId

      if (!setlistId) {
        return json({ success: false, message: 'Setlist ID is required.' }, { status: 400 })
      }

      // Place the transaction logic here for deleting the setlist
      await prisma.$transaction(async transactionPrisma => {
        const setlist = await transactionPrisma.setlist.findUnique({
          where: { id: setlistId },
          select: {
            sets: {
              select: {
                id: true,
              },
            },
          },
        })

        if (!setlist) {
          return json({ success: false, message: 'Setlist not found.' }, { status: 404 })
        }

        const setIdArray = setlist.sets.map(set => set.id)

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

      return redirect(`/bands/${params.bandId}/setlists`)
    }

    // You can add more cases here for other types of actions
    default:
      return json({ success: false, message: 'Invalid intent.' }, { status: 400 })
  }
}

export default function SetlistDetailViewRoute() {
  const { setlist, events, unusedBandSongs } = useLoaderData<typeof loader>()
  const params = useParams()
  const csvData = prepareCSVData(setlist, unusedBandSongs)
  const [searchParams, setSearchParams] = useSearchParams()

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-4 flex flex-wrap sm:justify-between">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h1 className="text-body-lg font-bold">{setlist.name}</h1>
          <AssociatedEventsDropdownMenu />
        </div>

        <div className="flex flex-wrap items-end gap-3 sm:flex sm:items-start">
          <Link relative="path" to="../edit">
            <Button size="sm">Edit</Button>
          </Link>

          <DownloadCSVButton
            data={csvData}
            filename={`${setlist?.events?.[0]?.name} - ${setlist?.events?.[0]?.date}`}
          />

          <DeleteSetlist />
        </div>

        {/* Associate Setlist to Event */}
      </div>

      {!!events.length && <AssociateSetlistToEvent setlistId={setlist.id} events={events} />}
      {/* Setlist Columns */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {setlist.sets.map((set, setIndex) => {
          // if set id is in searchParams return null
          if (searchParams.get('completeSetId')?.split(',').includes(set.id)) {
            return null
          }

          return (
            <div key={set.id} className="flex flex-col rounded border border-foreground p-4 shadow">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-2 outline outline-muted-foreground">
                <h2 className="text-center text-xl font-bold text-muted-foreground">Set {setIndex + 1}</h2>

                <Button
                  size="xs"
                  variant="default"
                  className="flex items-center gap-1"
                  onClick={() => {
                    let existingIds = searchParams.get('completeSetId')?.split(',') || []
                    if (!existingIds.includes(set.id)) {
                      existingIds.push(set.id)
                    }
                    setSearchParams({ completeSetId: existingIds.join(',') })
                  }}
                >
                  <Icon name="cross-1" className="text-success" />
                </Button>
              </div>
              <ul>
                {set.setSongs
                  .sort((a, b) => a.order - b.order)
                  .map((setSong, setSongIndex) => (
                    // Song List Item

                    <li key={setSong.song.id} className="mb-2">
                      <div className="flex flex-col flex-wrap gap-0.5">
                        {/* Title, Lyrics Link, YouTube Link */}

                        <div className="flex items-center gap-2">
                          <div className="h-full flex-col justify-start text-body-2xs">{setSongIndex + 1}</div>

                          <Link to={`/bands/${params.bandId}/songs/${setSong.song.id}/view`}>
                            <span className="text-sm font-bold text-primary hover:underline">{setSong.song.title}</span>
                          </Link>

                          {setSong.song.lyrics?.id ? (
                            <Link
                              to={`/bands/${params?.bandId}/songs/${setSong.song.id}/lyrics`}
                              className={cn('flex items-center text-muted-foreground')}
                              title="Open Lyrics"
                            >
                              <Icon name="file-text" className="text-hyperlink hover:text-hyperlink-hover" />
                            </Link>
                          ) : (
                            <a
                              href={
                                setSong.song.youtubeUrl ||
                                `https://www.google.com/search?q=${encodeURIComponent(`${setSong.song.title} by ${setSong.song.artist} guitar chords`)}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center"
                              title="Search Google for Chords"
                            >
                              <Icon
                                name="question-mark-circled"
                                className="text-hyperlink hover:text-hyperlink-hover"
                              />
                            </a>
                          )}

                          <a
                            href={
                              setSong.song.youtubeUrl ||
                              `https://www.google.com/search?q=${encodeURIComponent(`${setSong.song.title} by ${setSong.song.artist}`)}+youtube+video`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center"
                            title="Search YouTube for Song Video"
                          >
                            <Icon name="link-2" className="text-hyperlink hover:text-hyperlink-hover" />
                          </a>
                        </div>

                        {/* Artist and Rating (if one exists) */}

                        {/* <div className="flex items-center gap-1"> */}
                        {/* <span className="text-xs text-muted-foreground">{setSong.song.artist}</span> */}

                        {/* {setSong.song.rating && (
                          <div className="inline-flex rounded-full bg-muted px-1 text-button text-muted-foreground">
                            {setSong.song.rating}
                          </div>
                        )} */}
                        {/* </div> */}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )
        })}

        {/* Unused Songs Column */}

        <div className="rounded border border-foreground p-4 shadow">
          <h2 className="mb-4 text-center text-xl font-bold text-muted-foreground outline outline-muted-foreground">
            EXTRA SONGS
          </h2>
          <ul>
            {unusedBandSongs.map((setSong, setSongIndex) => (
              // Song List Item

              <li key={setSong.song.id} className="mb-2">
                <div className="flex flex-col flex-wrap gap-0.5">
                  {/* Title, Lyrics Link, YouTube Link */}

                  <div className="flex items-center gap-2">
                    <div className="h-full flex-col justify-start text-body-2xs">{setSongIndex + 1}</div>

                    <Link to={`/bands/${params.bandId}/songs/${setSong.song.id}/view`}>
                      <span className="text-sm font-bold text-primary hover:underline">{setSong.song.title}</span>
                    </Link>

                    {setSong.song.lyrics?.id ? (
                      <Link
                        to={`/bands/${params?.bandId}/songs/${setSong.song.id}/lyrics`}
                        className={cn('flex items-center text-muted-foreground')}
                        title="Open Lyrics"
                      >
                        <Icon name="file-text" className="text-hyperlink hover:text-hyperlink-hover" />
                      </Link>
                    ) : (
                      <a
                        href={
                          setSong.song.youtubeUrl ||
                          `https://www.google.com/search?q=${encodeURIComponent(`${setSong.song.title} by ${setSong.song.artist} guitar chords`)}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center"
                        title="Search Google for Chords"
                      >
                        <Icon name="question-mark-circled" className="text-hyperlink hover:text-hyperlink-hover" />
                      </a>
                    )}

                    <a
                      href={
                        setSong.song.youtubeUrl ||
                        `https://www.google.com/search?q=${encodeURIComponent(`${setSong.song.title} by ${setSong.song.artist}`)}+youtube+video`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center"
                      title="Search YouTube for Song Video"
                    >
                      <Icon name="link-2" className="text-hyperlink hover:text-hyperlink-hover" />
                    </a>
                  </div>

                  {/* Artist and Rating (if one exists) */}

                  {/* <div className="flex items-center gap-1"> */}
                  {/* <span className="text-xs text-muted-foreground">{setSong.song.artist}</span> */}

                  {/* {setSong.song.rating && (
                          <div className="inline-flex rounded-full bg-muted px-1 text-button text-muted-foreground">
                            {setSong.song.rating}
                          </div>
                        )} */}
                  {/* </div> */}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

const AssociateSetlistToEvent = ({ setlistId, events }: { setlistId: string; events?: any[] }) => {
  return (
    <Form
      method="post"
      className="flex max-w-2xl flex-col gap-4"
      action={`/resources/setlist/${setlistId}/associate-event`}
      navigate={false}
    >
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-[2.5] flex-shrink-0 gap-2">
          <select
            name="eventId"
            className={cn(
              'flex h-10 w-full max-w-xl rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:border-input-invalid',
            )}
          >
            <option value="">Assign to event</option>
            {events?.map(event => (
              <option key={event.id} value={event.id}>
                {event.name}: {formatDate(event.date)}
              </option>
            ))}
          </select>
        </div>

        <Button className="flex-1" type="submit">
          Assign
        </Button>
      </div>
    </Form>
  )
}

function DeleteSetlist() {
  const params = useParams()
  const dc = useDoubleCheck()
  const fetcher = useFetcher()

  return (
    <fetcher.Form method="POST">
      <Button
        {...dc.getButtonProps({
          type: 'submit',
          name: 'setlistId',
          value: params.setlistId,
        })}
        variant={dc.doubleCheck ? 'destructive' : 'destructive'}
      >
        <Icon name="trash">{dc.doubleCheck ? `Are you sure?` : `Delete Setlist`}</Icon>
      </Button>
      <input type="hidden" name="intent" value="deleteSetlist" />
    </fetcher.Form>
  )
}

function AssociatedEventsDropdownMenu() {
  const { setlist } = useLoaderData<typeof loader>()
  const params = useParams()

  const currentlyAssignedEvents = setlist.events

  // return all here if there are no currently assigned events

  if (!currentlyAssignedEvents?.length) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm">
          {currentlyAssignedEvents.length > 0
            ? `${currentlyAssignedEvents.length} Associated Events`
            : `No Associated Events`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          sideOffset={8}
          alignOffset={-20}
          align="start"
          className="flex max-w-[98vw] flex-col flex-wrap gap-3"
        >
          {currentlyAssignedEvents.map(event => (
            <DropdownMenuItem key={event.id} asChild className="flex flex-wrap">
              <Link
                to={`/bands/${params.bandId}/events/${event?.id}/view`}
                className="flex flex-col border-2 border-foreground p-2"
                key={event.name}
              >
                <Link
                  to={`/bands/${params.bandId}/events/${event?.id}/view`}
                  className="hover:text-muted-foreground hover:underline"
                >
                  <span className="text-2xl font-bold">{event?.name}</span>
                </Link>
                <Link
                  to={`/bands/${params.bandId}/venues/${event?.venue?.id}/view`}
                  className="flex items-center gap-1 text-lg hover:text-muted-foreground hover:underline"
                >
                  <span className="text-muted-foreground">@{event?.venue?.name}</span>
                </Link>
                <span className="text-sm text-foreground">{formatDate(event?.date || '')}</span>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        404: () => {
          return (
            <div className="flex flex-wrap items-center gap-2">
              <p>You must select an event to associate the setlist with before clicking "Assign"</p>
              <Button asChild variant="default" size="lg">
                <Link to=".">Back</Link>
              </Button>
            </div>
          )
        },
      }}
    />
  )
}
