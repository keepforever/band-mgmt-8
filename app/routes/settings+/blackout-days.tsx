import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { json, useLoaderData, useSubmit } from '@remix-run/react'
import { months } from '#app/constants/months'
import { requireUserId } from '#app/utils/auth.server'
import { isDayInListOfDates } from '#app/utils/date'
import { prisma } from '#app/utils/db.server'
import { cn } from '#app/utils/misc'
import { createToastHeaders } from '#app/utils/toast.server'

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

export default function Example() {
  const currentDate = new Date()
  const { user } = useLoaderData<typeof loader>()
  const submit = useSubmit()

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
                      dates: user.blackoutDates.map(d => d.date),
                    })

                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => {
                          submit(
                            {
                              date: day.date,
                              intent: isCurrentDayBlackedOutForUser ? 'delete' : 'add',
                            },
                            {
                              method: 'post',
                            },
                          )
                        }}
                        className={cn({
                          'text-text-black bg-yellow-800 py-1.5 hover:bg-yellow-500 focus:z-10':
                            isCurrentDayBlackedOutForUser,
                          'bg-accent py-1.5 text-accent-foreground hover:bg-red-800 focus:z-10':
                            !isCurrentDayBlackedOutForUser,
                        })}
                      >
                        <time
                          dateTime={day.date}
                          className={cn(
                            isCurrentDay && isCurrentMonth && 'bg-green-200 font-semibold text-black',
                            'mx-auto flex h-7 w-7 items-center justify-center rounded-full',
                            'border-2 border-blue-100',
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
