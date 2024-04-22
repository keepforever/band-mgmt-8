import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { EmptyStateGeneric } from '#app/components/empty-state-generic.js'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { TableGeneric, type Column } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { prisma } from '#app/utils/db.server'
import { formatDate } from '#app/utils/misc'

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const bandId = params.bandId
  const events = await prisma.event.findMany({
    where: {
      bands: {
        some: {
          bandId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      date: true,
      location: true,
      Setlist: {
        include: {
          BandSetlist: {
            select: {
              setlistId: true,
            },
          },
        },
      },
      venue: {
        select: {
          name: true,
          location: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  })
  return json({ events })
}

export default function EventsRoute() {
  const { events } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const bandId = useParams().bandId

  const columns: Column<(typeof events)[0]>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      render: date => formatDate(date),
    },
    {
      title: 'Location',
      dataIndex: 'location',
    },
    {
      title: 'Venue',
      dataIndex: 'venue',
      render: (venue, record) => <span className="capitalize">{`${venue.name} - ${venue.location}`}</span>,
    },
    {
      title: 'Setlist',
      dataIndex: 'Setlist',
      render: (setlist, record) => {
        const setlistId = setlist?.BandSetlist?.[0]?.setlistId
        if (!setlistId) return 'No Setlist Found'

        return (
          // http://localhost:3000/bands/cltg3ec8f0027ig7vxbhxxfab/setlists/cltg3o36q00024ey44moes965
          <Link to={`/bands/${bandId}/setlists/${setlistId}`}>View Setlist</Link>
        )
      },
      stopPropagation: true,
    },
  ]

  if (events.length === 0) {
    return (
      <div className="mx-auto max-w-7xl">
        <EmptyStateGeneric
          iconNames={['pope']}
          title="No Events Found"
          messages={['Add a new event to get started.']}
          linkTo="new"
          buttonTitle="Add Event"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <HeaderWithActions title="Events">
        <Link to="new">
          <Button type="button" variant="outline">
            Add Event
          </Button>
        </Link>
      </HeaderWithActions>

      <TableGeneric columns={columns} data={events} onRowClick={event => navigate(`${event.id}/view`)} />
    </div>
  )
}
