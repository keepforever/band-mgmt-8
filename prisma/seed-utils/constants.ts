import { faker } from '@faker-js/faker'

export const dummyVenueNames = [
  'Roxy',
  'Viper Room',
  'Troubadour',
  'Whisky a Go Go',
  'Echo',
  'Satellite',
  'Mint',
  'Bootleg Theater',
  'Hotel Cafe',
  'Regent Theater',
  'El Rey Theatre',
  'Teragram Ballroom',
  'Fonda Theatre',
  'Palladium',
  'Greek Theatre',
  'Hollywood Bowl',
].sort(() => Math.random() - 0.5)

export const dummyEventNames = [
  'Battle of the Bands',
  'Open Mic Night',
  'County Fair',
  'Hardly Strictly Bluegrass',
  'Coachella',
  'Burning Man',
  'Outside Lands',
  'Bonnaroo',
  'Lollapalooza',
  'Glastonbury',
].sort(() => Math.random() - 0.5)

export function getFutureDate() {
  const tempDate = faker.date.future({
    refDate: new Date(),
    years: 0.9,
  })
  const datePayload = new Date(Date.UTC(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate()))
  return datePayload
}

export function capitalLorem(): string {
  return faker.lorem
    .words(2)
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
