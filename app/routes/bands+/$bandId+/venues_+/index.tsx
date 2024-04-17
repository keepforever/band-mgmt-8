import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { prisma } from '#app/utils/db.server'
import { cn } from '#app/utils/misc.js'

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
  return json({ venues })
}

export default function VenuesIndexRoute() {
  const { venues } = useLoaderData<typeof loader>()

  return (
    <div className="container mx-auto px-4">
      <div className="my-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Venues</h1>
        <Button asChild variant="secondary" size="lg">
          <Link to="new">Add New Venue</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue, index) => (
          <div key={index} className="rounded-lg border border-gray-200 bg-background p-4 shadow-md">
            <Link
              to={`/bands/${venue.bandId}/venues/${venue.venue.id}/view`}
              className="mt-2 text-blue-600 hover:underline"
            >
              <h2 className="text-xl font-semibold">{venue.venue.name}</h2>
            </Link>
            <p className="text-foreground">Location: {venue.venue.location}</p>
            <p className="text-foreground">Capacity: {venue.venue.capacity}</p>
            <details
              className={cn({
                hidden: venue.venue.events.length === 0,
              })}
            >
              <summary>See Events</summary>

              <ul className="mt-2 list-disc pl-5">
                {venue.venue.events.map(event => (
                  <li key={event.id} className="text-foreground">
                    {event.name}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ))}
      </div>
    </div>
  )
}
