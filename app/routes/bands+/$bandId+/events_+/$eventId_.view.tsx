// EventDetailView.tsx
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { type FC } from 'react'
import { Button } from '#app/components/ui/button'
import { prisma } from '#app/utils/db.server.ts'
import { formatDate } from '#app/utils/misc'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const eventId = params.eventId
  const event = await prisma.event?.findUnique({
    where: {
      id: eventId,
    },
    include: {
      venue: true,
      bands: true,
      Setlist: true,
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
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
      {address}
    </a>
  )
}

export default function EventDetailView() {
  const { event } = useLoaderData<typeof loader>()

  return (
    <div>
      <div className="flex justify-between px-4 sm:px-0">
        <h3 className="text-lg font-semibold leading-7">{event?.name}</h3>

        <Link relative="path" to="../edit" className="text-blue-500 hover:underline">
          <Button size="sm">Edit</Button>
        </Link>
      </div>
      <div className="mt-6 border-t border-white/10">
        <dl className="divide-y divide-white/10">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Event Name</dt>

            <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">{event?.name}</dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Date & Location</dt>

            <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">{`${formatDate(String(event?.date))}, ${event?.location}`}</dd>
          </div>
          {event?.venue && (
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6">Venue</dt>

              <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">{`${event?.venue.name}, ${event?.venue.location} (Capacity: ${event?.venue.capacity ?? 'N/A'})`}</dd>
            </div>
          )}
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Bands</dt>

            <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
              <ul>{event?.bands.map(band => <li key={band.bandId}>{band.bandId}</li>)}</ul>
            </dd>
          </div>

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Address</dt>

            <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
              <AddressLink address={`${event?.venue?.name} in ${event?.venue?.location}`} />

              {/* For testing */}
              {/* <AddressLink address={`House of Blue in Cleveland`} /> */}
            </dd>
          </div>

          {event?.Setlist && (
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6">Setlist</dt>

              <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
                {/* Button link to setlist by id */}

                <Link
                  to={`/bands/${event?.bands[0].bandId}/setlists/${event?.Setlist?.id}/view`}
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
