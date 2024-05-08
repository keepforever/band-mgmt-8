import { faker } from '@faker-js/faker'
import { promiseHash } from 'remix-utils/promise'
import { prisma } from '#app/utils/db.server.ts'
import { cleanupDb, createPassword, createUser, getUserImages, img } from '#tests/db-utils.ts'
import { dummyVenueNames, dummyEventNames } from './seed-utils/constants'

function getFutureDate() {
  const tempDate = faker.date.future({
    refDate: new Date(),
    years: 0.9,
  })
  const datePayload = new Date(Date.UTC(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate()))
  return datePayload
}

function capitalLorem(): string {
  return faker.lorem
    .words(2)
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

async function seed() {
  console.info('🌱 Seeding...')
  console.time(`🌱 Database has been seeded`)

  console.time('🧹 Cleaned up the database...')
  await cleanupDb(prisma)
  console.timeEnd('🧹 Cleaned up the database...')

  console.time('🔑 Created permissions...')
  const entities = ['user', 'note']
  const actions = ['create', 'read', 'update', 'delete']
  const accesses = ['own', 'any'] as const
  for (const entity of entities) {
    for (const action of actions) {
      for (const access of accesses) {
        await prisma.permission.create({ data: { entity, action, access } })
      }
    }
  }
  console.timeEnd('🔑 Created permissions...')

  console.time('🔑 Created bands...')
  await prisma.band.create({
    data: {
      name: capitalLorem(),
      members: {
        create: [
          {
            isAdmin: true,
            user: {
              create: {
                name: faker.person.firstName(),
                username: faker.internet.userName(),
                email: faker.internet.email(),
              },
            },
          },
        ],
      },
    },
  })

  console.time('🔑 Created bands...')
  const createdBand = await prisma.band.create({
    data: {
      name: capitalLorem(),
      members: {
        create: [
          {
            isAdmin: true,
            user: {
              create: {
                name: faker.person.firstName(),
                username: faker.internet.userName(),
                email: faker.internet.email(),
              },
            },
          },
        ],
      },
    },
  })
  console.timeEnd(`🎸 Created ${createdBand.name}  band...`)

  console.time('👑 Created roles...')
  await prisma.role.create({
    data: {
      name: 'admin',
      permissions: {
        connect: await prisma.permission.findMany({
          select: { id: true },
          where: { access: 'any' },
        }),
      },
    },
  })
  await prisma.role.create({
    data: {
      name: 'user',
      permissions: {
        connect: await prisma.permission.findMany({
          select: { id: true },
          where: { access: 'own' },
        }),
      },
    },
  })
  console.timeEnd('👑 Created roles...')

  const totalUsers = 5
  console.time(`👤 Created ${totalUsers} users...`)
  const userImages = await getUserImages()

  for (let index = 0; index < totalUsers; index++) {
    const userData = createUser()
    await prisma.user
      .create({
        select: { id: true },
        data: {
          ...userData,
          password: { create: createPassword(userData.username) },
          image: { create: userImages[index % userImages.length] },
          roles: { connect: { name: 'user' } },
        },
      })
      .catch(e => {
        console.error('Error creating a user:', e)
        return null
      })
  }
  console.timeEnd(`👤 Created ${totalUsers} users...`)

  console.time(`🐨 Created admin user "kody"`)

  const kodyImages = await promiseHash({
    kodyUser: img({ filepath: './tests/fixtures/images/user/kody.png' }),
  })

  const kodyUser = await prisma.user.create({
    select: { id: true },
    data: {
      email: 'kody@kcd.dev',
      username: 'kody',
      name: 'Kody',
      image: { create: kodyImages.kodyUser },
      password: { create: createPassword('tacobell') },
      roles: { connect: [{ name: 'admin' }, { name: 'user' }] },
      blackoutDates: {
        create: [
          {
            date: getFutureDate(),
          },
          {
            date: getFutureDate(),
          },
          {
            date: getFutureDate(),
          },
          {
            date: getFutureDate(),
          },
          {
            date: getFutureDate(),
          },
          {
            date: getFutureDate(),
          },
          {
            date: getFutureDate(),
          },
          {
            date: getFutureDate(),
          },
          {
            date: getFutureDate(),
          },
          {
            date: getFutureDate(),
          },
          {
            date: getFutureDate(),
          },
          {
            date: getFutureDate(),
          },
        ],
      },
    },
  })
  console.timeEnd(`🐨 Created admin user "kody"`)

  console.time('🎸 Created KODY band...')
  const kodyBand = await prisma.band.create({
    data: {
      name: capitalLorem(),
      members: {
        create: [
          {
            isAdmin: true,
            instrument: 'Saxophone',
            user: {
              connect: {
                id: kodyUser.id,
              },
            },
          },
        ],
      },
    },
  })
  console.timeEnd('🎸 Created KODY band...')

  // Create Techs for Kody Band
  // console.time('🔧 Creating techs for KODY band...')
  // const serviceTypes = ['Sound Engineer', 'Lighting Technician', 'Stage Manager', 'Roadie', 'Security']

  // for (let i = 0; i < serviceTypes.length; i++) {
  //   await prisma.tech.create({
  //     data: {
  //       name: faker.person.firstName() + ' ' + faker.person.lastName(),
  //       contactInfo: faker.internet.email(),
  //       email: faker.internet.email(),
  //       phone: faker.phone.number(),
  //       rate: faker.number.int({ min: 100, max: 500 }),
  //       serviceType: {
  //         create: {
  //           name: serviceTypes[i],
  //           description: `Responsible for ${serviceTypes[i].toLowerCase()} at events.`,
  //         },
  //       },
  //       bands: {
  //         create: [{ bandId: kodyBand.id }],
  //       },
  //     },
  //   })
  // }
  // console.timeEnd('🔧 Creating techs for KODY band...')

  // Create 5 songs associated with the created band
  for (let i = 0; i < 5; i++) {
    await prisma.song.create({
      data: {
        artist: faker.music.genre(), // Random artist name
        title: faker.music.songName(), // Random song title
        youtubeUrl: 'https://youtu.be/i8dh9gDzmz8', // Random URL, assuming songs might have a video link
        rating: faker.number.int({ min: 0, max: 5 }), // Random rating
        status: 'active', // Assuming a default status for the song
        bandSongs: {
          create: [
            {
              band: {
                connect: {
                  id: kodyBand.id,
                },
              },
            },
          ],
        },
      },
    })
  }

  console.time('🏟️ Created venues...')
  const venueIds = []
  for (let index = 0; index < 5; index++) {
    const tempId = await prisma.venue.create({
      data: {
        location: faker.location.city(),
        name: dummyVenueNames[index],
        capacity: faker.number.int({ min: 100, max: 1000 }),
        bands: {
          create: [
            {
              band: {
                connect: {
                  id: kodyBand.id,
                },
              },
            },
          ],
        },
      },
    })
    venueIds.push(tempId.id)
  }
  console.timeEnd('🏟️ Created venues...')

  // create events
  console.time('📅 Created events...')
  for (let index = 0; index < 2; index++) {
    const tempDate = faker.date.future({
      refDate: new Date(),
      years: 0.5,
    })
    const datePayload = new Date(Date.UTC(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate()))

    await prisma.event.create({
      data: {
        date: datePayload,
        // location: faker.location.city(),
        requiresPASystem: faker.datatype.boolean(),
        payment: faker.number.int({ min: 750, max: 1300 }),
        name: dummyEventNames[index],
        startEndTime: '8:00 PM - 11:00 PM',
        venue: {
          connect: {
            id: venueIds[faker.number.int({ min: 0, max: venueIds.length - 1 })],
          },
        },
        bands: {
          create: [
            {
              band: {
                connect: {
                  id: kodyBand.id,
                },
              },
            },
          ],
        },
      },
    })
  }
  console.timeEnd('📅 Created events...')

  console.timeEnd(`🌱 Database has been seeded`)
}

seed()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
