import { prisma } from './db.server'

export async function getEventsByBandId(bandId: string) {
  const events = await prisma.event.findMany({
    where: {
      bands: {
        some: {
          bandId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      date: true,
      location: true,
      Setlist: {
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

  return events
}

export async function getEventsByDateAndBandId({ date, bandId }: { date: Date; bandId: string }) {
  // Convert the input date to the start of the day in UTC
  const startOfDayUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
  // cleaner maybe:
  // const startOfDayUTC = new Date(date.setUTCHours(0, 0, 0, 0))

  // Calculate the end of the day in UTC by adding one day to the start of the day minus 1 millisecond
  const endOfDayUTC = new Date(startOfDayUTC)
  endOfDayUTC.setUTCDate(endOfDayUTC.getUTCDate() + 1)
  endOfDayUTC.setUTCMilliseconds(-1)

  const events = await prisma.event.findMany({
    where: {
      AND: [
        {
          date: {
            gte: startOfDayUTC,
            lte: endOfDayUTC,
          },
        },
        {
          bands: {
            some: {
              bandId,
            },
          },
        },
      ],
    },
    include: {
      bands: true, // Adjust according to your needs for related band data
    },
  })

  return events
}
