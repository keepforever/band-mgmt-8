// EventDetailView.tsx
import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { type FC } from 'react'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon.js'
import { StatusButton } from '#app/components/ui/status-button.js'
import { prisma } from '#app/utils/db.server.ts'
import { cn, formatDate, useDoubleCheck } from '#app/utils/misc'
import { redirectWithToast } from '#app/utils/toast.server.js'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const eventId = params.eventId
  const event = await prisma.event?.findUnique({
    where: {
      id: eventId,
    },
    include: {
      venue: true,
      bands: true,
      setlist: true,
    },
  })
  return json({ event })
}

interface AddressLinkProps {
  address: string // The address as a searchable query
}

const AddressLink: FC<AddressLinkProps> = ({ address }) => {
  // Encode the address for URL use
  const encodedAddress = encodeURIComponent(address)
  // Use a Google Maps link as it's widely supported & often triggers the native map app
  const href = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-hyperlink hover:underline">
      {address}
    </a>
  )
}

export default function EventDetailView() {
  const { event } = useLoaderData<typeof loader>()

  return (
    <div>
      <div className="flex flex-wrap justify-between gap-3 px-4 sm:px-0">
        {/* Event name and Revenue column */}

        <div className="flex flex-col">
          <h3 className="text-lg font-semibold leading-7">{event?.name}</h3>

          <div className="flex items-center gap-2">
            <div className="text-body-xs font-semibold text-accent-two">${event?.payment}</div>

            {event?.requiresPASystem && (
              <span className="inline-flex rounded-full bg-hyperlink px-1.5 py-px text-xs font-semibold uppercase tracking-wider text-muted">
                PA System
              </span>
            )}
          </div>
        </div>

        {/* Edit and Delete buttons */}

        <div className="flex flex-wrap items-center gap-2">
          <Link relative="path" to="../edit" className="text-hyperlink hover:underline">
            <Button size="sm">Edit</Button>
          </Link>

          <DeleteEvent />
        </div>
      </div>
      <div className="mt-6 border-t border-white/10">
        <dl className="divide-y divide-white/10">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Date & Location</dt>

            <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">{`${formatDate(String(event?.date))}, ${event?.location}`}</dd>
          </div>
          {event?.venue && (
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6">Venue</dt>
              <Link
                relative="path"
                to={`../../../venues/${event?.venue.id}/view`}
                className="mt-1 text-sm leading-6 text-hyperlink hover:underline sm:col-span-2 sm:mt-0"
              >
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">{`${event?.venue.name}, ${event?.venue.location} (Capacity: ${event?.venue.capacity ?? 'N/A'})`}</dd>
              </Link>
            </div>
          )}

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Address</dt>

            <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
              <AddressLink address={`${event?.venue?.name} in ${event?.venue?.location}`} />
            </dd>
          </div>

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Notes</dt>

            <dd
              className={cn('mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0', {
                'text-foreground/60': !event?.notes,
              })}
            >
              {event?.notes ?? 'N/A'}
            </dd>
          </div>

          {event?.setlist && (
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6">Setlist</dt>

              <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
                {/* Button link to setlist by id */}

                <Link
                  to={`/bands/${event?.bands[0].bandId}/setlists/${event?.setlist?.id}/view`}
                  className="text-hyperlink hover:text-hyperlink-hover hover:underline"
                >
                  View Setlist
                </Link>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const eventId = formData.get('eventId') as string

  invariantResponse(eventId, 'Event ID is required')

  await prisma.event.delete({
    where: { id: eventId },
  })

  return redirectWithToast('/events', {
    type: 'success',
    title: 'Event Deleted',
    description: 'The event has been deleted successfully.',
  })
}

function DeleteEvent() {
  const data = useLoaderData<typeof loader>()
  const dc = useDoubleCheck()
  const fetcher = useFetcher<typeof action>()

  return (
    <fetcher.Form method="POST">
      <StatusButton
        {...dc.getButtonProps({
          type: 'submit',
          name: 'eventId',
          value: data?.event?.id,
        })}
        variant={dc.doubleCheck ? 'destructive' : 'destructive'}
        status={fetcher.state !== 'idle' ? 'pending' : fetcher?.state ?? 'idle'}
        size="sm"
      >
        <Icon name="trash">{dc.doubleCheck ? `Are you sure?` : `Delete Event`}</Icon>
      </StatusButton>
    </fetcher.Form>
  )
}
