// months.ts
export interface Day {
  date: string // "YYYY-MM-DD"
  day: number // day of month
  dayIndex: number // day of week (0-6) computed in UTC
  dateIsoString: string // ISO string built in UTC
  name: string // short day name
}

export interface Month {
  year: number
  monthIndex: number // 0-indexed month (0 = January)
  name: string // month name, e.g. "March"
  days: Day[]
  offset: number // first day of month weekday (0 = Sunday) in UTC for calendar grid
}

/**
 * Returns an array of months built entirely in UTC.
 * @param numMonths Number of consecutive months to generate, starting from current month in UTC.
 */
export function getMonths(numMonths: number): Month[] {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Use UTC components of current date
  const now = new Date()
  let year = now.getUTCFullYear()
  let month = now.getUTCMonth()

  const months: Month[] = []

  for (let i = 0; i < numMonths; i++) {
    // Build the first day of the month in UTC
    const firstDay = new Date(Date.UTC(year, month, 1))
    const offset = firstDay.getUTCDay() // day of week (0-6)

    // Number of days in month: last day of month is day 0 of next month.
    const lastDay = new Date(Date.UTC(year, month + 1, 0))
    const numDays = lastDay.getUTCDate()

    const days: Day[] = []
    for (let d = 1; d <= numDays; d++) {
      const dayDate = new Date(Date.UTC(year, month, d))
      const isoString = dayDate.toISOString()
      days.push({
        date: `${year.toString().padStart(4, '0')}-${(month + 1)
          .toString()
          .padStart(2, '0')}-${d.toString().padStart(2, '0')}`,
        day: d,
        dayIndex: dayDate.getUTCDay(),
        dateIsoString: isoString,
        name: dayNames[dayDate.getUTCDay()],
      })
    }

    months.push({
      year,
      monthIndex: month,
      name: monthNames[month],
      days,
      offset,
    })

    // Move to the next month
    month++
    if (month > 11) {
      month = 0
      year++
    }
  }

  return months
}
