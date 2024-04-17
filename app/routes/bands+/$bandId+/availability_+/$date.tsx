// CreateVenueForm.tsx
import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
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
    where: {
      date: searchDate,
    },
    select: {
      date: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  })

  const eventsTwo = await getEventsByDateAndBandId({ date: searchDate, bandId })

  return json({ blackoutDates, eventsTwo })
}

export default function DateDetailView() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <div className="container mx-auto max-w-md">
      <h1 className="text-center text-2xl font-bold">Hello date detail</h1>
      {/* Render any events or blackout dates */}

      <div className="mt-4">
        <h2 className="text-lg font-semibold">Events Two</h2>
        <ul>
          {loaderData.eventsTwo.map(event => (
            <li key={event.id}>
              <p>{event.name}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold">Blackout Dates</h2>
        <ul>
          {loaderData.blackoutDates.map(date => (
            <li key={date.date}>
              <p>{date.date}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
