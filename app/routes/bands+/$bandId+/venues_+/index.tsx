import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { TableGeneric, type Column } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { prisma } from '#app/utils/db.server'

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const bandId = params.bandId
  const venues = await prisma.bandVenue.findMany({
    where: {
      bandId,
    },
    select: {
      bandId: true,
      venue: {
        select: {
          capacity: true,
          id: true,
          events: {
            select: {
              id: true,
              name: true,
            },
          },
          location: true,
          name: true,
        },
      },
    },
  })
  return json({
    venues: venues.map(v => ({
      id: v.venue.id || '',
      name: v.venue.name || '',
      location: v.venue.location || '',
      capacity: v.venue.capacity || 0,
      eventCount: v.venue.events.length || 0,
    })),
  })
}

type VenueInfo = {
  id: string
  name: string
  location: string
  capacity: number
  eventCount: number
}

export default function VenuesIndexRoute() {
  const { venues } = useLoaderData<typeof loader>()
  const { bandId } = useParams()
  const navigate = useNavigate()

  const columns: Column<VenueInfo>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (value, record) => (
        <Link to={`/bands/${bandId}/venues/${record.id}/view`} className="text-blue-600 hover:underline">
          {value}
        </Link>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
    },
    {
      title: 'Events',
      dataIndex: 'eventCount',
    },
  ]

  return (
    <div>
      <HeaderWithActions title="Venues">
        <Link to="new">
          <Button variant="secondary" size="sm">
            Add New Venue
          </Button>
        </Link>
      </HeaderWithActions>

      <TableGeneric
        columns={columns}
        data={venues}
        onRowClick={event => navigate(`/bands/${bandId}/venues/${event.id}/view`)}
      />
    </div>
  )
}
