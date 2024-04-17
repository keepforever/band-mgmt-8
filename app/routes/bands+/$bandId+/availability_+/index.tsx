import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { json, useLoaderData, useNavigate } from '@remix-run/react'
import { months } from '#app/constants/months'
import { requireUserId } from '#app/utils/auth.server'
import { isDayInListOfDates } from '#app/utils/date'
import { prisma } from '#app/utils/db.server'
import { getEventsByBandId } from '#app/utils/events.server'
import { cn } from '#app/utils/misc'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
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

  return json({ events, bandMembers, allBlackoutDates })
}

export default function AvailabilityIndexRoute() {
  const currentDate = new Date()
  const { events, bandMembers, allBlackoutDates } = useLoaderData<typeof loader>()
  const navigate = useNavigate()

  console.group(
    `%capp/routes/bands+/$bandId+/availability_+/index.tsx`,
    'color: #ffffff; font-size: 13px; font-weight: bold;',
  )
  // console.log('\n', `user = `, user, '\n')
  // console.log('\n', `events = `, events, '\n')
  console.log('\n', `bandMembers = `, bandMembers, '\n')
  console.log('\n', `allBlackoutDates = `, allBlackoutDates, '\n')
  console.groupEnd()

  return (
    <div>
      <div className="bg-background">
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 xl:max-w-none xl:grid-cols-3 2xl:grid-cols-4">
          {months.map((month, index) => {
            const date = new Date()
            const isCurrentMonth = date.getMonth() === month.monthIndex
            return (
              <section key={`${month.name}_${month.year}}`} className="text-center">
                <h2 className="font-semibold text-foreground">
                  {month.name} <small>{month.year}</small>
                </h2>

                <div className="mt-6 grid grid-cols-7 text-xs leading-6 text-foreground">
                  <div>S</div>
                  <div>M</div>
                  <div>T</div>
                  <div>W</div>
                  <div>T</div>
                  <div>F</div>
                  <div>S</div>
                </div>
                <div className="isolate mt-2 grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-slate-700 text-sm shadow ring-1 ring-green-200">
                  {Array.from(Array(month.offset).keys()).map((el, i) => (
                    <div key={el}></div>
                  ))}

                  {month.days.map(day => {
                    const isCurrentDay = currentDate.getDate() === day.day

                    const isCurrentDayBlackedOutForUser = isDayInListOfDates({
                      currentDay: day.date,
                      dates: allBlackoutDates.map(d => d.date),
                    })

                    const isCurrentDayAnEvent = isDayInListOfDates({
                      currentDay: day.date,
                      dates: events.map(e => e.date),
                    })

                    const isCurrentDayBlackedOutForAnotherUser = allBlackoutDates.some(d => {
                      console.log('\n', `d.date = `, d.date, '\n')
                      console.log('\n', `day.date = `, day.date, '\n')
                      console.log('\n', `d.isCurrentUser = `, d.isCurrentUser, '\n')

                      return d.date === day.date && !d.isCurrentUser
                    })

                    isCurrentDayBlackedOutForAnotherUser &&
                      console.log(
                        '\n',
                        `isCurrentDayBlackedOutForAnotherUser = `,
                        isCurrentDayBlackedOutForAnotherUser,
                        '\n',
                      )

                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => navigate(`${day.date}`)}
                        className={cn({
                          'bg-yellow-800 py-1.5 text-white hover:bg-yellow-500 focus:z-10':
                            isCurrentDayBlackedOutForUser,
                          'bg-accent py-1.5 text-accent-foreground hover:bg-red-800 focus:z-10':
                            !isCurrentDayBlackedOutForUser,
                          'bg-green-500': isCurrentDayAnEvent,
                        })}
                      >
                        <time
                          dateTime={day.date}
                          className={cn(
                            'mx-auto flex h-7 w-7 items-center justify-center rounded-full',
                            'border-2 border-blue-100',
                            {
                              'bg-green-200 font-semibold text-black': isCurrentDay && isCurrentMonth,
                            },
                          )}
                        >
                          {day?.date?.split?.('-')?.pop?.()?.replace?.(/^0/, '')}
                        </time>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
