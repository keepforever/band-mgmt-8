import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, json, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, Link, redirect, useLoaderData, useParams } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { cn, formatDate } from '#app/utils/misc.js'

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
      event: {
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

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-wrap-reverse sm:flex-wrap sm:justify-between">
        <div className="flex flex-col">
          {/* Setlist Title */}

          <h1 className="mb-4 text-2xl font-bold">{setlist.name}</h1>

          {/* Event */}

          <div className="flex flex-col border-2 border-foreground px-2 py-1">
            <span className="text-accent-two text-xl font-bold">{setlist.event?.name}</span>
            <Link
              to={`/bands/${params.bandId}/venues/${setlist.event?.venue?.id}/view`}
              className="hover:text-accent-two flex items-center gap-1 hover:underline"
            >
              <div className="flex gap-1">
                <span>{setlist?.event?.venue?.name}</span>, <span>{setlist?.event?.location}</span>
              </div>
            </Link>
            <span className="text-foreground">{formatDate(setlist?.event?.date || '')}</span>
          </div>
        </div>

        <div className="flex items-end gap-3 sm:items-start">
          <Link relative="path" to="../edit">
            <Button size="sm">Edit</Button>
          </Link>

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
            <h2 className="outline-accent-two text-accent-two mb-4 text-center text-xl font-bold outline">
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
                        <span className="text-accent-two text-xs">{setSong.song.artist}</span>
                        {setSong.song.rating && (
                          <div className="text-accent-two inline-flex items-center justify-center rounded-full bg-destructive px-1 text-xs">
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
    </div>
  )
}
