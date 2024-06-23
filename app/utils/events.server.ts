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
      setlist: {
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
    select: {
      name: true,
      location: true,
      setlist: {
        select: {
          id: true,
        },
      },
      date: true,
      id: true,
      venueId: true,
      venue: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
    },
  })

  return events
}

export async function getNextThreeEventsByBandId(bandId: string) {
  const now = new Date()
  const events = await prisma.bandEvent.findMany({
    where: {
      bandId: bandId,
      event: {
        date: {
          gt: now,
        },
      },
    },
    select: {
      event: {
        select: {
          id: true,
          name: true,
          date: true,
          location: true,
          venue: {
            select: {
              name: true,
              location: true,
            },
          },
        },
      },
    },
    orderBy: {
      event: {
        date: 'asc',
      },
    },
    take: 3,
  })

  const flattenedEvents = events.map(event => event.event)

  return flattenedEvents
}
