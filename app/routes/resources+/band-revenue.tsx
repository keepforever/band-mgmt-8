import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { prisma } from '#app/utils/db.server.js'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // get request search params
  const url = new URL(request.url)
  const bandId = url.searchParams.get('bandId')

  const currentYearBandEvents = await prisma.bandEvent.findMany({
    where: {
      event: {
        date: {
          gte: new Date(new Date().getFullYear() - 1, 11, 31), // last day of the previous year
          lte: new Date(new Date().getFullYear(), 11, 31), // end of the current year
        },
      },
      bandId: String(bandId),
    },
    select: {
      event: {
        select: {
          payment: true,
        },
      },
    },
  })

  // sum up the revenue from all the events
  const currentYearRevenue = currentYearBandEvents.reduce(
    (total, bandEvent) => total + (bandEvent.event.payment || 0),
    0,
  )

  return json({ currentYearRevenue })
}
