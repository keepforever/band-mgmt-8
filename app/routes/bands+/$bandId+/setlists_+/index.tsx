import { type Setlist as SetlistModel } from '@prisma/client'
import { type SerializeFrom, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate } from '@remix-run/react'
import { TableGeneric, type Column } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { prisma } from '#app/utils/db.server'

export type Setlist = SerializeFrom<Pick<SetlistModel, 'name' | 'createdAt' | 'eventId' | 'id' | 'updatedAt'>>

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const bandId = params.bandId
  const setlists = await prisma.setlist.findMany({
    where: {
      BandSetlist: {
        some: {
          bandId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      eventId: true,
      event: {
        select: {
          name: true,
          date: true,
        },
      },
    },
  })
  return json({ setlists })
}

export default function SetlistsRoute() {
  const { setlists } = useLoaderData<typeof loader>()
  const navigate = useNavigate()

  const columns: Column<Setlist>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Event',
      dataIndex: 'event' as any,
      render: event =>
        !event ? (
          <span className="flex items-center text-xs text-gray-500">No Event</span>
        ) : (
          <div className="flex items-center text-xs">
            {event?.name} ({new Date(event?.date).toLocaleDateString()})
          </div>
        ),
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAt',
      render: updatedAt => new Date(updatedAt).toLocaleDateString(),
    },
  ]

  return (
    <>
      <div className="my-4 flex justify-between">
        <h2 className="text-3xl font-bold">Setlists</h2>
        <Button asChild variant="secondary" size="lg">
          <Link to="new">Create</Link>
        </Button>
      </div>

      <TableGeneric columns={columns} data={setlists} onRowClick={setlist => navigate(`${setlist.id}/view`)} />
    </>
  )
}
