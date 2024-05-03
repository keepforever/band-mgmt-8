import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { EmptyStateGeneric } from '#app/components/empty-state-generic.js'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { TableGeneric, type Column } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon.js'
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
      payment: true,
      setlist: {
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
      title: 'Venue',
      dataIndex: 'venue',
      render: (venue, record) => {
        return (
          <div className="flex flex-wrap items-center gap-2">
            <span className="capitalize">{`${venue.name}`}</span>
            <Link
              title="Edit event"
              to={`${record.id}/edit`}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-button font-semibold transition-all duration-300 ease-in-out hover:bg-status-info hover:text-accent-foreground"
            >
              <Icon name="pencil-2" className="h-4 w-4" onClick={e => e.stopPropagation()} />
            </Link>
          </div>
        )
      },
    },
    {
      title: 'Date',
      dataIndex: 'date',
      render: date => {
        return (
          <span className="tracking-wide" title={formatDate(date, { year: 'numeric', month: 'long', day: '2-digit' })}>
            {formatDate(date, {
              year: 'numeric',
              month: 'numeric',
              day: '2-digit',
            })}
          </span>
        )
      },
    },
    {
      title: 'Pay',
      dataIndex: 'payment',
      render: payment =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(payment),
    },
    {
      title: 'Setlist',
      dataIndex: 'setlist',
      render: (setlist, record) => {
        const setlistId = setlist?.BandSetlist?.[0]?.setlistId

        if (!setlistId) return 'N/A'

        return (
          // http://localhost:3000/bands/cltg3ec8f0027ig7vxbhxxfab/setlists/cltg3o36q00024ey44moes965
          <Link
            className="hover:text-hyperlink hover:underline"
            to={`/bands/${bandId}/setlists/${setlistId}/view`}
            onClick={e => e.stopPropagation()}
          >
            View
          </Link>
        )
      },
    },
  ]

  if (events.length === 0) {
    return (
      <div className="mx-auto max-w-7xl">
        <EmptyStateGeneric
          iconNames={['rocket']}
          title="No Events Found"
          messages={['Add a new event to get started.']}
          linkTo="new"
          buttonTitle="Add Event"
        />
      </div>
    )
  }

  return (
    <>
      <HeaderWithActions title="Events">
        <Link to="new">
          <Button type="button" variant="outline">
            Add Event
          </Button>
        </Link>
      </HeaderWithActions>

      <div className="max-w-3xl">
        <TableGeneric columns={columns} data={events} onRowClick={event => navigate(`${event.id}/view`)} />
      </div>
    </>
  )
}
