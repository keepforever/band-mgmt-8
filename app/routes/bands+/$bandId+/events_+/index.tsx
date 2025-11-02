import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate, useParams, useSearchParams } from '@remix-run/react'
import { startOfDay, subDays } from 'date-fns'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { EmptyStateGeneric } from '#app/components/empty-state-generic.js'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { TableGeneric, type Column } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '#app/components/ui/chart'
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
  const now = startOfDay(subDays(new Date(), 1))

  const baseQuery = {
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
      date: 'asc' as const,
    },
  }

  // Get filtered events (for table and first chart)
  const events = await prisma.event.findMany({
    ...baseQuery,
    where: {
      ...baseQuery.where,
      ...(futureOnly && {
        date: {
          gte: now,
        },
      }),
    },
  })

  // Get all-time events (for second chart)
  const allTimeEvents = await prisma.event.findMany(baseQuery)

  return json({ events, allTimeEvents })
}

const chartConfig: ChartConfig = {
  payment: {
    label: 'Payment',
    color: 'hsl(var(--accent-two))',
  },
}

const EventBarCharts = ({
  events,
  allTimeEvents,
}: {
  events: Array<{ venue: string; payment: number }>
  allTimeEvents: Array<{ venue: string; payment: number }>
}) => {
  return (
    <div className="mt-6 space-y-8">
      {/* Filtered Events Chart */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Current View: Event Payments by Venue</h2>
          <p className="text-sm text-muted-foreground">Shows payments based on your current filter settings</p>
        </div>
        {events.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={events}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="venue" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={100} interval={0} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={value => `$${value}`} />
              <ChartTooltip content={<ChartTooltipContent />} formatter={value => [`$${value}`, 'Payment']} />
              <Bar dataKey="payment" fill="var(--color-payment)" />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center rounded-lg border bg-muted/10">
            <p className="text-muted-foreground">No events in current view</p>
          </div>
        )}
      </div>

      {/* All Time Events Chart */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">All Time: Event Payments by Venue</h2>
          <p className="text-sm text-muted-foreground">Complete payment history across all events</p>
        </div>
        {allTimeEvents.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={allTimeEvents}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="venue" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={100} interval={0} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={value => `$${value}`} />
              <ChartTooltip content={<ChartTooltipContent />} formatter={value => [`$${value}`, 'Payment']} />
              <Bar dataKey="payment" fill="var(--color-payment)" />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center rounded-lg border bg-muted/10">
            <p className="text-muted-foreground">No events found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function EventsRoute() {
  const { events, allTimeEvents } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const bandId = useParams().bandId
  const [searchParams, setSearchParams] = useSearchParams()

  // Group and sum payments by venue for filtered events
  const venuePayments = events.reduce(
    (acc, event) => {
      const venueName = String(event?.venue?.name || 'Unknown Venue')
      if (!acc[venueName]) {
        acc[venueName] = 0
      }
      acc[venueName] += event.payment || 0
      return acc
    },
    {} as Record<string, number>,
  )

  // Group and sum payments by venue for all-time events
  const allTimeVenuePayments = allTimeEvents.reduce(
    (acc, event) => {
      const venueName = String(event?.venue?.name || 'Unknown Venue')
      if (!acc[venueName]) {
        acc[venueName] = 0
      }
      acc[venueName] += event.payment || 0
      return acc
    },
    {} as Record<string, number>,
  )

  // Convert the objects to arrays of objects
  const venuePaymentArray = Object.keys(venuePayments).map(venue => ({
    venue,
    payment: venuePayments[venue],
  }))

  const allTimeVenuePaymentArray = Object.keys(allTimeVenuePayments).map(venue => ({
    venue,
    payment: allTimeVenuePayments[venue],
  }))

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
            <span className="">{venue.name}</span>
            <Link
              title="Edit event"
              to={`${record.id}/edit`}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-button font-semibold transition-all duration-300 ease-in-out hover:bg-status-info hover:text-accent-foreground"
            >
              <Icon name="pencil-2" className="h-4 w-4" onClick={e => e.stopPropagation()} />
            </Link>

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

        <EventBarCharts events={venuePaymentArray} allTimeEvents={allTimeVenuePaymentArray} />
      </div>
    </>
  )
}
