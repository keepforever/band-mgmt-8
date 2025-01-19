import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { json, useLoaderData, useNavigate } from '@remix-run/react'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { getMonths } from '#app/constants/months'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { getEventsByBandId } from '#app/utils/events.server'
import { cn } from '#app/utils/misc'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  await requireUserBelongToBand(request, params)

  const bandId = params.bandId
  invariantResponse(bandId, 'Band ID is required')
  const events = await getEventsByBandId(bandId)

  const bandMembers = await prisma.userBand.findMany({
    where: {
      bandId,
    },
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          blackoutDates: {
            select: {
              id: true,
              date: true,
            },
          },
        },
      },
    },
  })

  const allBlackoutDates = bandMembers.flatMap(member =>
    member.user.blackoutDates.map(date => ({
      date: date.date,
      isCurrentUser: member.userId === userId,
    })),
  )

  const payload = { events, bandMembers, allBlackoutDates }

  return json(payload)
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
  isBlackoutForUser: boolean
  isBlackoutForCurrentUser: boolean // New property
  isEventDay: boolean
}

export const DayComponent: React.FC<DayComponentProps> = ({
  day,
  isToday,
  isBlackoutForUser,
  isBlackoutForCurrentUser,
  isEventDay,
}) => {
  const navigate = useNavigate()
  const handleDayClick = () => navigate(day.date)
  // if (isToday) console.info('Availability DayComponent', { day, isToday, isBlackoutForUser })
  return (
    <button
      type="button"
      onClick={handleDayClick}
      className={cn('bg-muted py-1', {
        'bg-status-warning text-foreground hover:bg-status-warning-foreground focus:z-10':
          isBlackoutForUser && !isBlackoutForCurrentUser,
        'bg-status-warning text-secondary-foreground hover:bg-status-info-foreground hover:text-primary focus:z-10':
          isBlackoutForUser,
        'bg-status-error text-foreground hover:bg-status-error-foreground focus:z-10': isBlackoutForCurrentUser,
        'bg-status-success': isEventDay,
        'hover:bg-destructive-foreground hover:text-foreground-destructive':
          !isEventDay && !isBlackoutForUser && !isBlackoutForCurrentUser,
      })}
    >
      <time
        dateTime={day.date}
        className={cn('mx-auto flex h-7 w-7 items-center justify-center rounded-full', 'border-2 border-ring', {
          'bg-status-success font-semibold': isToday,
        })}
      >
        {day.day.toString()}
      </time>
    </button>
  )
}

export const Weekdays = () => (
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

export default function AvailabilityIndexRoute() {
  const currentDate = new Date()
  const { events, allBlackoutDates } = useLoaderData<typeof loader>()
  const months = getMonths(14)
  const allEventDatesSet = new Set(events.map(e => e.date))

  return (
    <div>
      <HeaderWithActions title="Availability" />

      {/* Months Grid */}

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
                  const isBlackoutForUser = allBlackoutDates.some(d => d.date === dayIsoString)
                  const isBlackoutForCurrentUser = allBlackoutDates.some(
                    d => d.date === dayIsoString && d.isCurrentUser,
                  )

                  return (
                    <DayComponent
                      key={day.date}
                      day={day}
                      isToday={isToday && isCurrentYear}
                      isBlackoutForUser={isBlackoutForUser}
                      isBlackoutForCurrentUser={isBlackoutForCurrentUser}
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
