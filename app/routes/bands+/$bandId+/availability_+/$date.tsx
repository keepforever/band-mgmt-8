import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { Card, CardContent } from '#app/components/ui/card.js'
import { Icon } from '#app/components/ui/icon.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'
import { getEventsByDateAndBandId } from '#app/utils/events.server'

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

  return (
    <div className="container mx-auto max-w-lg">
      <h1 className="text-center text-2xl font-bold">Hello date detail</h1>
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Events</h2>
        {events.length > 0 ? (
          <ul>
            {events.map(event => (
              <li key={event.id}>
                <p>
                  {event.name} - {event.location}
                </p>
                <p>{new Date(event.date).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="mx-auto w-full max-w-lg">
            <CardContent className="flex flex-col items-center gap-4 p-10">
              <Icon name="pope" className="h-40 w-40 fill-current text-gray-400 dark:text-gray-500" />
              <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="text-2xl font-bold">You haven’t added any events for this date yet</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add your first event to get started.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Blackout Dates</h2>
        {blackoutDates.length > 0 ? (
          <ul>
            {blackoutDates.map(blackout => (
              <li key={blackout.date}>
                <p>
                  {new Date(blackout.date).toLocaleDateString()} - {blackout.user.name}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="mx-auto w-full max-w-lg">
            <CardContent className="flex flex-col items-center gap-4 p-10">
              <Icon name="monkey" className="h-40 w-40 fill-current text-gray-400 dark:text-gray-500" />
              <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="text-2xl font-bold">No blackout dates for this day</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enjoy your day!</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
