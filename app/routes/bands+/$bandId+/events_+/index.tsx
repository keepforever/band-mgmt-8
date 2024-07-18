import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate, useParams, useSearchParams } from '@remix-run/react'
import * as d3 from 'd3'
import { startOfDay, subDays } from 'date-fns'
import { useEffect, useRef } from 'react'
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
  const now = startOfDay(subDays(new Date(), 1))

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

const EventBarChart = ({ events }: { events: Array<{ venue: string; payment: number }> }) => {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    const width = 800
    const height = 400
    const margin = { top: 20, right: 30, bottom: 100, left: 50 }

    svg.attr('width', width).attr('height', height)

    const x = d3
      .scaleBand()
      .domain(events.map(event => event.venue))
      .range([margin.left, width - margin.right])
      .padding(0.1)

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(events, event => event.payment)!])
      .nice()
      .range([height - margin.bottom, margin.top])

    const truncateText = (text: string, maxLength: number) => {
      return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
    }

    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat((d: string) => truncateText(d, 10)))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dy', '1em')
      .style('font-size', '14px')

    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickFormat(d => `$${d}`),
      )
      .selectAll('text')
      .style('font-size', '14px')

    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('border', '1px solid #ccc')
      .style('padding', '5px')
      .style('display', 'none')
      .style('pointer-events', 'none')

    svg
      .append('g')
      .selectAll('rect')
      .data(events)
      .enter()
      .append('rect')
      .attr('x', event => x(event.venue)!)
      .attr('y', event => y(event.payment))
      .attr('height', event => y(0) - y(event.payment))
      .attr('width', x.bandwidth())
      .attr('fill', `hsl(var(--accent-two))`)
      .on('mouseover', (event, d) => {
        tooltip.style('display', 'block').html(`${d.venue}<br><strong>$${d.payment}</strong>`)
      })
      .on('mousemove', event => {
        tooltip.style('left', `${event.pageX + 5}px`).style('top', `${event.pageY - 28}px`)
      })
      .on('mouseout', () => {
        tooltip.style('display', 'none')
      })
  }, [events])

  return (
    <div className="mt-6 flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Event Payments by Venue</h2>
      <svg ref={svgRef} className="hidden md:block"></svg>
    </div>
  )
}

export default function EventsRoute() {
  const { events } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const bandId = useParams().bandId
  const [searchParams, setSearchParams] = useSearchParams()

  // Group and sum payments by venue
  const venuePayments = events.reduce(
    (acc, event) => {
      const venueName = String(event?.venue?.name)
      if (!acc[venueName]) {
        acc[venueName] = 0
      }
      acc[venueName] += event.payment || 0
      return acc
    },
    {} as Record<string, number>,
  )

  // Convert the object to an array of objects
  const venuePaymentArray = Object.keys(venuePayments).map(venue => ({
    venue,
    payment: venuePayments[venue],
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

        <EventBarChart events={venuePaymentArray} />
      </div>
    </>
  )
}
