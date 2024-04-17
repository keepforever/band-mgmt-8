interface Params {
  currentDay: string
  dates: string[]
}

export const isDayInListOfDates = ({ currentDay, dates }: Params): boolean => {
  return dates.some(date => {
    const dateFormatted = date.substring(0, 10) // Converts ISO string to "YYYY-MM-DD"
    const bingo = dateFormatted === currentDay
    return bingo
  })
}

interface Params {
  currentDay: string
  dates: string[]
}

export const isDayInListOfDatesNew = ({ currentDay, dates }: Params): boolean => {
  return dates.some(date => {
    return date === currentDay
  })
}
