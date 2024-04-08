import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate, useParams } from '@remix-run/react'
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
      render: date => formatDate(date), // Assuming formatDate is defined elsewhere
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

  return (
    <>
      <div className="mx-auto max-w-7xl">
        <div className="bg-background py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h1 className="text-base font-semibold leading-6 text-foreground">Events</h1>
                <p className="mt-2 text-sm text-accent-foreground">Showing all events for the band</p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <Link to="new">
                  <Button
                    type="button"
                    className="block rounded-md bg-indigo-500 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  >
                    Add Event
                  </Button>
                </Link>
              </div>
            </div>

            <TableGeneric columns={columns} data={events} onRowClick={event => navigate(`${event.id}/view`)} />
          </div>
        </div>
      </div>
    </>
  )
}
