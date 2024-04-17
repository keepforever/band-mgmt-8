import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, json, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, Link, redirect, useLoaderData } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'

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

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-wrap justify-between">
        <div className="flex flex-col">
          <h1 className="mb-4 text-2xl font-bold">{setlist.name}</h1>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-blue-500">{setlist.event?.name}</span>
            <span className="text-gray-500">{setlist?.event?.location}</span>
            <span className="text-gray-500">{setlist?.event?.date}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
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
          <div key={set.id} className="rounded border border-gray-200 p-4 shadow">
            <h2 className="mb-4 text-xl font-bold">Set {setIndex + 1}</h2>
            <ul>
              {set.setSongs
                .sort((a, b) => a.order - b.order)
                .map(setSong => (
                  <li key={setSong.song.id} className="mb-2">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-blue-500">{setSong.song.title}</span>
                      <span className="text-gray-500">{setSong.song.artist}</span>
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
