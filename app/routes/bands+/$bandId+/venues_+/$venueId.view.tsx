// VenueDetails.tsx
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  const venueId = params.venueId

  if (!userId || !venueId) throw new Error('Unauthorized access or missing venue ID')

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      id: true,
      name: true,
      location: true,
      capacity: true,
    },
  })

  if (!venue) throw new Error('Venue not found')

  return json({ venue })
}

export default function VenueDetails() {
  const { venue } = useLoaderData<typeof loader>()

  console.group(`%c$venueId.view.tsx`, 'color: #ffffff; font-size: 13px; font-weight: bold;')
  console.log('\n', `venue = `, venue, '\n')
  console.groupEnd()

  return (
    <div>
      <div className="flex justify-between px-4 sm:px-0">
        <h3 className="text-lg font-semibold leading-7">
          {venue?.name}, located at {venue?.location}
        </h3>

        <Link relative="path" to={`../edit`} className="text-blue-500 hover:underline">
          <Button size="sm">Edit Venue</Button>
        </Link>
      </div>
      <div className="mt-6 border-t border-white/10">
        <dl className="divide-y divide-white/10">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Name</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-400 sm:col-span-2 sm:mt-0">{venue?.name}</dd>
          </div>

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Location</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-400 sm:col-span-2 sm:mt-0">{venue?.location}</dd>
          </div>

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Capacity</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-400 sm:col-span-2 sm:mt-0">{venue?.capacity}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
