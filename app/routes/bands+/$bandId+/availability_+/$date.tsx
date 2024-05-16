import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData, useParams } from '@remix-run/react'
import { Button } from '#app/components/ui/button.js'
import { Card, CardContent, CardTitle } from '#app/components/ui/card.js'
import { Icon } from '#app/components/ui/icon.js'
import { UserCard } from '#app/components/user-card.js'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'
import { getEventsByDateAndBandId } from '#app/utils/events.server'
import { formatDate } from '#app/utils/misc.js'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request)
  await requireUserBelongToBand(request, params)
  const bandId = params.bandId
  const dateParam = params.date

  invariantResponse(bandId, 'Band ID is required')
  invariantResponse(dateParam, 'Date ID is required')

  const searchDate = new Date(dateParam)
  const endDate = new Date(searchDate)
  endDate.setDate(searchDate.getDate() + 1)

  const blackoutDates = await prisma.blackoutDate.findMany({
    where: { date: searchDate },
    select: {
      date: true,
      user: {
        select: {
          name: true,
          id: true,
          image: true,
          bands: {
            where: { bandId },
            select: { instrument: true },
            take: 1,
          },
        },
      },
    },
  })

  const events = await getEventsByDateAndBandId({ date: searchDate, bandId })

  return json({ blackoutDates, events })
}

export default function DateDetailView() {
  const { events, blackoutDates } = useLoaderData<typeof loader>()
  const { date, bandId } = useParams()
  const formattedDate = formatDate(String(date))

  if (!events.length && !blackoutDates.length) {
    return (
      <div className="container mx-auto">
        <Card className="mx-auto w-full max-w-lg bg-muted text-muted-foreground">
          <CardContent className="flex flex-col items-center gap-4 p-10">
            <Icon name="moon" className="h-40 w-40 fill-muted-foreground" />

            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-body-lg font-bold">All Clear!</h2>
              <p className="text-sm text-muted-foreground">No events or unavailable members on this date.</p>
            </div>
            <div className="flex w-full">
              <Link relative="path" to=".." className="w-full">
                <Button variant="secondary" className="w-full">
                  Back
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <h1 className="mt-5 text-body-lg underline">{formattedDate}</h1>

      {/* Events */}
      {events.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-3 text-lg font-semibold">Events</h2>
          <ul>
            {events.map(event => (
              <li key={event.id} className="mb-2">
                <Card>
                  <CardContent className="p-5">
                    <CardTitle>
                      <Link to={`/bands/${bandId}/events/${event.id}/view`} className="hover:text-blue-700">
                        {event.name}
                      </Link>
                    </CardTitle>

                    <p className="text-foreground-destructive">{event.location}</p>
                    {event.venue && (
                      <p className="text-gray-500">
                        Venue: {event.venue.name}, Location: {event.venue.location}
                      </p>
                    )}
                    {event.setlist && (
                      <Link
                        to={`/bands/${bandId}/setlists/${event.setlist.id}/view`}
                        className="text-hyperlink hover:text-hyperlink-hover"
                      >
                        View Setlist
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Blackout Dates */}
      {blackoutDates.length > 0 && (
        <div className="mt-4">
          <ul className="flex flex-wrap gap-4">
            {blackoutDates.map(blackout => (
              <UserCard
                instrument={blackout.user.bands[0].instrument || 'Unknown'}
                key={blackout.user.id}
                imageId={String(blackout.user.image?.id)}
                name={blackout.user.name}
                isPending={false}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
