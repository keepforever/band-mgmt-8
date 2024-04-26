import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { json, useLoaderData, useSubmit } from '@remix-run/react'
import { getMonths } from '#app/constants/months.js'
import { requireUserId } from '#app/utils/auth.server'
import { isDayInListOfDates } from '#app/utils/date'
import { prisma } from '#app/utils/db.server'
import { cn } from '#app/utils/misc'
import { createToastHeaders } from '#app/utils/toast.server'
import { Weekdays } from '../bands+/$bandId+/availability_+'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      name: true,
      blackoutDates: {
        select: {
          date: true,
        },
      },
    },
  })

  return json({ user })
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request)
  const formData = await request.formData()
  const date = formData.get('date')
  const intent = formData.get('intent')

  if (intent === 'add') {
    const toastHeaders = await createToastHeaders({
      title: 'Added',
      description: 'Blackout date added',
      type: 'success',
    })

    invariantResponse(typeof date === 'string', 'Date is required, and must be a string')

    await prisma.blackoutDate.create({
      data: {
        date: new Date(date),
        userId,
      },
    })

    return json({ status: 'success' } as const, { headers: toastHeaders })
  }

  if (intent === 'delete') {
    const toastHeaders = await createToastHeaders({
      title: 'Removed',
      description: 'Blackout date removed',
      type: 'success',
    })

    invariantResponse(typeof date === 'string', 'Date is required, and must be a string')

    await prisma.blackoutDate.deleteMany({
      where: {
        date: new Date(date),
      },
    })

    return json({ status: 'success' } as const, { headers: toastHeaders })
  }

  const toastHeaders = await createToastHeaders({
    title: 'Oops',
    description: 'Something went wrong',
    type: 'error',
  })

  return json({ status: 'success' } as const, { headers: toastHeaders })
}

export default function BlackoutDays() {
  const currentDate = new Date()
  const { user } = useLoaderData<typeof loader>()
  const submit = useSubmit()
  const months = getMonths(12)

  return (
    <div className="">
      <h1 className="mb-4 text-h4 text-foreground">Blackout Days</h1>

      {/* Months Grid */}

      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 xl:max-w-none xl:grid-cols-3 2xl:grid-cols-4">
        {months.map((month, index) => {
          const date = new Date()
          const isCurrentMonth = date.getMonth() === month.monthIndex
          return (
            <section key={`${month.name}_${month.year}}`} className="text-center">
              <h2 className="font-semibold text-foreground">
                {month.name} <small>{month.year}</small>
              </h2>

              <Weekdays />

              <div className="isolate mt-2 grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-slate-700 text-sm shadow ring-1 ring-green-200">
                {Array.from(Array(month.offset).keys()).map((el, i) => (
                  <div key={el}></div>
                ))}
                {month.days.map(day => {
                  const isCurrentDayBlackedOutForUser = isDayInListOfDates({
                    currentDay: day.date,
                    dates: user.blackoutDates.map(d => d.date),
                  })

                  return (
                    <DayComponent
                      key={day.date}
                      day={day.date}
                      isToday={isCurrentMonth && currentDate.getDate() === day.day}
                      isBlackoutForUser={isCurrentDayBlackedOutForUser}
                      onToggleBlackout={(date, isCurrentlyBlackout) => {
                        submit({ date, intent: isCurrentlyBlackout ? 'delete' : 'add' }, { method: 'post' })
                      }}
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

interface DayComponentProps {
  day: string // The date of the day
  isToday: boolean // If the day is today
  isBlackoutForUser: boolean // If the day is a blackout day for the user
  onToggleBlackout: (date: string, isCurrentlyBlackout: boolean) => void // Callback to handle blackout toggle
}

export const DayComponent: React.FC<DayComponentProps> = ({ day, isToday, isBlackoutForUser, onToggleBlackout }) => {
  const submit = useSubmit()
  const handleDayClick = () => {
    const intent = isBlackoutForUser ? 'delete' : 'add'
    submit({ date: day, intent }, { method: 'post' })
  }

  const dayNumber = day.split('-').pop()?.replace(/^0/, '')

  return (
    <button
      type="button"
      onClick={handleDayClick}
      className={cn('py-1', {
        'bg-yellow-800 text-foreground hover:bg-yellow-500 focus:z-10': isBlackoutForUser,
        'bg-accent text-accent-foreground hover:bg-red-800 focus:z-10': !isBlackoutForUser,
      })}
    >
      <time
        dateTime={day}
        className={cn('mx-auto flex h-7 w-7 items-center justify-center rounded-full border-2 border-accent-two', {
          'bg-green-200 font-semibold text-black': isToday,
        })}
      >
        {dayNumber}
      </time>
    </button>
  )
}
