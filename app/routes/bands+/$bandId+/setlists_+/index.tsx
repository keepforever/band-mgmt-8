import { type Setlist as SetlistModel } from '@prisma/client'
import { type SerializeFrom, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate } from '@remix-run/react'
import { EmptyStateGeneric } from '#app/components/empty-state-generic.js'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { TableGeneric, type Column } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { prisma } from '#app/utils/db.server'

export type Setlist = SerializeFrom<Pick<SetlistModel, 'name' | 'createdAt' | 'id' | 'updatedAt'>> & {
  events: {
    name: string
    date: string
  }[]
}

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
      events: {
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
      dataIndex: 'events',
      render: (events: Setlist['events']) =>
        !events.length ? (
          <span className="flex items-center text-xs text-gray-500">No Events</span>
        ) : (
          <div className="flex items-center text-xs">{`${events.length} Events`}</div>
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
      <HeaderWithActions title="Setlists">
        <Button asChild variant="secondary" size="lg">
          <Link to="new">Create</Link>
        </Button>
      </HeaderWithActions>

      {setlists.length === 0 ? (
        <EmptyStateGeneric
          title="No Setlists"
          messages={['Create a new setlist by clicking the "Create" button above.']}
          iconNames={['pope']}
          linkTo="new"
          buttonTitle="Create Setlist"
        />
      ) : (
        <TableGeneric columns={columns} data={setlists} onRowClick={setlist => navigate(`${setlist.id}/view`)} />
      )}
    </>
  )
}
