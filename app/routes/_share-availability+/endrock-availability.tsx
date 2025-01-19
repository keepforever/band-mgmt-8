import { invariantResponse } from '@epic-web/invariant'
import { json, useLoaderData } from '@remix-run/react'
import { getMonths } from '#app/constants/months'
import { prisma } from '#app/utils/db.server'
import { getEventsByBandId } from '#app/utils/events.server'
import { cn } from '#app/utils/misc'

export const loader = async () => {
  const bandId = process.env.NODE_ENV === 'development' ? 'clx3lonuz0005qlh4ibkib8oe' : 'clw7xric200002wxex7hfz9ua'
  invariantResponse(bandId, 'Band ID is required')
  const events = await getEventsByBandId(bandId)

  // Get all blackout dates for the band but don't include user information
  const bandMembersBlackoutDates = await prisma.userBand.findMany({
    where: { bandId },
    select: {
      user: {
        select: {
          blackoutDates: {
            select: { date: true },
          },
        },
      },
    },
  })

  // Flatten the blackout dates into a single array of dates
  const blackoutDates = [
    ...new Set(bandMembersBlackoutDates.flatMap(member => member.user.blackoutDates.map(date => date.date))),
  ]

  return json({ events, blackoutDates })
}

interface DayComponentProps {
  day: {
    date: string
    dateIsoString: string
    name: string
    dayIndex: number
    day: number
  }
  isToday: boolean
  isBlackoutDay: boolean
  isEventDay: boolean
}

const DayComponent: React.FC<DayComponentProps> = ({ day, isToday, isBlackoutDay, isEventDay }) => {
  return (
    <div
      className={cn('bg-muted py-1', {
        'bg-status-warning text-foreground': isBlackoutDay || isEventDay,
      })}
    >
      <time
        dateTime={day.date}
        className={cn('mx-auto flex h-7 w-7 items-center justify-center rounded-full', {
          'bg-status-success font-semibold': isToday,
        })}
      >
        {day.day.toString()}
      </time>
    </div>
  )
}

const Weekdays = () => (
  <div className="mt-6 grid grid-cols-7 text-xs leading-6 text-foreground">
    <div>S</div>
    <div>M</div>
    <div>T</div>
    <div>W</div>
    <div>T</div>
    <div>F</div>
    <div>S</div>
  </div>
)

const Legend = () => (
  <div className="flex flex-wrap items-center gap-6 text-sm font-semibold md:justify-center">
    <div className="flex items-center space-x-2">
      <div className="h-8 w-8 rounded bg-status-warning"></div>
      <span>Not Available</span>
    </div>
    <div className="flex items-center space-x-2">
      <div className="h-8 w-8 rounded bg-status-success"></div>
      <span>Today</span>
    </div>
    <div className="flex items-center space-x-2">
      <div className="h-8 w-8 rounded bg-muted outline outline-1"></div>
      <span>Available</span>
    </div>
  </div>
)

export default function PublicCalendarView() {
  const currentDate = new Date()
  const { events, blackoutDates } = useLoaderData<typeof loader>()
  const months = getMonths(14)
  const allEventDatesSet = new Set(events.map(e => e.date))
  const blackoutDatesSet = new Set(blackoutDates)

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <img src="/endrock-logo.png" className="w-full max-w-sm" alt="Endrock Logo" />
        </div>

        <Legend />

        {/* <p className="max-w-lg">
          We do our best to keep this availability calendar up to date, but any date will need to be confirmed with all band
          members before we can commit.
        </p> */}
      </div>

      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 xl:max-w-none xl:grid-cols-3 2xl:grid-cols-4">
        {months.map(month => {
          const isCurrentMonth = currentDate.getMonth() === month.monthIndex
          const isCurrentYear = currentDate.getFullYear() === month.year

          return (
            <section key={`${month.name}_${month.year}}`} className="text-center">
              <h2 className="font-semibold text-foreground">
                {month.name} <small>{month.year}</small>
              </h2>

              <Weekdays />

              <div className="isolate mt-2 grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-secondary text-sm shadow ring-1">
                {Array.from(Array(month.offset).keys()).map(el => (
                  <div key={el}></div>
                ))}

                {month.days.map((day, dayIndex) => {
                  const dayIsoString = new Date(day.date).toISOString()
                  const isEventDay = allEventDatesSet.has(dayIsoString)
                  const isToday = isCurrentMonth && currentDate.getDate() === day.day
                  const isBlackoutDay = blackoutDatesSet.has(dayIsoString)

                  return (
                    <DayComponent
                      key={day.date}
                      day={day}
                      isToday={isToday && isCurrentYear}
                      isBlackoutDay={isBlackoutDay}
                      isEventDay={isEventDay}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
