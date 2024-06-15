import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate, useParams, useSearchParams } from '@remix-run/react'
import { EmptyStateGeneric } from '#app/components/empty-state-generic.js'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { TableGeneric, type Column } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { Checkbox } from '#app/components/ui/checkbox.js'
import { Icon } from '#app/components/ui/icon.js'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server'
import { formatDate } from '#app/utils/misc'

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUserId(request)
  await requireUserBelongToBand(request, params)
  const bandId = params.bandId
  const url = new URL(request.url)
  const futureOnly = url.searchParams.get('futureOnly') === 'true'
  const now = new Date()

  const events = await prisma.event.findMany({
    where: {
      bands: {
        some: {
          bandId,
        },
      },
      ...(futureOnly && {
        date: {
          gte: now,
        },
      }),
    },
    select: {
      id: true,
      name: true,
      date: true,
      location: true,
      payment: true,
      EventTech: {
        select: {
          tech: {
            select: {
              id: true,
              name: true,
              serviceType: true,
            },
          },
        },
      },
      requiresPASystem: true,
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
  const [searchParams, setSearchParams] = useSearchParams()

  const columns: Column<(typeof events)[0]>[] = [
    {
      title: 'Date',
      dataIndex: 'date',
      render: date => {
        return (
          <span className="tracking-wide" title={formatDate(date, { year: 'numeric', month: 'long', day: '2-digit' })}>
            {formatDate(date, {
              year: '2-digit',
              month: 'numeric',
              day: '2-digit',
            })}
          </span>
        )
      },
    },
    {
      title: 'Venue',
      dataIndex: 'venue',
      render: (venue, record) => {
        return (
          <div className="flex items-center gap-1">
            {/* <span className="capitalize">{record.name}</span> */}
            <span className="">{venue.name}</span>
            <Link
              title="Edit event"
              to={`${record.id}/edit`}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-button font-semibold transition-all duration-300 ease-in-out hover:bg-status-info hover:text-accent-foreground"
            >
              <Icon name="pencil-2" className="h-4 w-4" onClick={e => e.stopPropagation()} />
            </Link>

            {/* If requires PA system and missing a tech show icon */}

            {record.requiresPASystem && !record.EventTech.length && (
              <span title="Requires PA system, but no tech assigned">
                <Icon name="avatar" className="h-5 w-5 text-destructive" onClick={e => e.stopPropagation()} />
              </span>
            )}

            {!!record.EventTech.length && (
              <span
                title={`Assigned Techs: ${record.EventTech.map(tech => `${tech.tech.name} (${tech.tech.serviceType.name})`).join(', ')}`}
              >
                <Icon name="avatar" className="h-4 w-4" onClick={e => e.stopPropagation()} />
              </span>
            )}
          </div>
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
        {/* Future Only Toggle */}

        <div className="flex gap-2 pl-3">
          <span className="text-sm font-semibold">Show Future Only</span>
          <label className="switch">
            <Checkbox
              defaultChecked={searchParams.get('futureOnly') === 'true'}
              onCheckedChange={state => {
                const params = new URLSearchParams()
                params.set('futureOnly', state.valueOf() ? 'true' : 'false')
                setSearchParams(params, {
                  preventScrollReset: true,
                })
              }}
            />
          </label>
        </div>

        <TableGeneric columns={columns} data={events} onRowClick={event => navigate(`${event.id}/view`)} />
      </div>
    </>
  )
}
