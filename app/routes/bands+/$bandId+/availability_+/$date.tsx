import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData, useParams } from '@remix-run/react'
import { Button } from '#app/components/ui/button.js'
import { Card, CardContent } from '#app/components/ui/card.js'
import { Icon } from '#app/components/ui/icon.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'
import { getEventsByDateAndBandId } from '#app/utils/events.server'
import { formatDate } from '#app/utils/misc.js'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request)
  const bandId = params.bandId
  const dateParam = params.date

  invariantResponse(bandId, 'Band ID is required')
  invariantResponse(dateParam, 'Date ID is required')

  const searchDate = new Date(dateParam)
  const endDate = new Date(searchDate)
  endDate.setDate(searchDate.getDate() + 1)

  const blackoutDates = await prisma.blackoutDate.findMany({
    where: { date: searchDate },
    select: { date: true, user: { select: { name: true } } },
  })

  const events = await getEventsByDateAndBandId({ date: searchDate, bandId })

  return json({ blackoutDates, events })
}

export default function DateDetailView() {
  const { events, blackoutDates } = useLoaderData<typeof loader>()
  const { date } = useParams()

  const formattedDate = formatDate(String(date))

  if (!events.length && !blackoutDates.length) {
    return (
      <div className="container mx-auto max-w-lg">
        <Card className="mx-auto w-full max-w-lg">
          <CardContent className="flex flex-col items-center gap-4 p-10">
            <Icon name="pope" className="h-40 w-40 fill-red-400 text-gray-400 dark:text-gray-500" />

            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-2xl font-bold">All Clear!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">No events or unavailable members on this date.</p>
            </div>
            <div className="flex w-full">
              <Link relative="path" to=".." className="w-full">
                <Button className="w-full">Back</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">{formattedDate}</h1>

      {/* Events */}

      {events.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-3 text-lg font-semibold">Events</h2>
          <ul>
            {events.map(event => (
              <li key={event.id}>
                <p>
                  {event.name} - {event.location}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Blackout Dates */}

      {blackoutDates.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-3 text-lg font-semibold">Unavailable Members</h2>
          <ul>
            {blackoutDates.map(blackout => (
              <li key={blackout.date}>
                <p>{blackout.user.name}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
