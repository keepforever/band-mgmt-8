import { faker } from '@faker-js/faker'
import { promiseHash } from 'remix-utils/promise'
import { prisma } from '#app/utils/db.server.ts'
import { cleanupDb, createPassword, createUser, getUserImages, img } from '#tests/db-utils.ts'
import { dummyVenueNames, dummyEventNames, dummyServiceTypes } from './seed-utils/constants'

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

  console.time('🛠️ Created service types...')

  for (let index = 0; index < dummyServiceTypes.length; index++) {
    const { name, description } = dummyServiceTypes[index]
    await prisma.serviceType
      .create({
        data: {
          name,
          description,
        },
      })
      .catch(e => {
        console.error('Error creating service type:', e)
        return null
      })
  }

  console.timeEnd('🛠️ Created service types...')

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

  // Add more members to Kody's band for a robust representation
  console.time('👥 Adding more members to KODY band...')

  const bandMemberData = [
    { name: 'Alex Johnson', instrument: 'Guitar', email: 'alex.johnson@example.com' },
    { name: 'Sarah Williams', instrument: 'Bass', email: 'sarah.williams@example.com' },
    { name: 'Mike Chen', instrument: 'Drums', email: 'mike.chen@example.com' },
    { name: 'Emma Davis', instrument: 'Keyboard', email: 'emma.davis@example.com' },
    { name: 'Jordan Smith', instrument: 'Vocals', email: 'jordan.smith@example.com' },
  ]

  for (const memberData of bandMemberData) {
    // Create user for band member
    const bandMember = await prisma.user.create({
      data: {
        name: memberData.name,
        username: memberData.name.toLowerCase().replace(' ', '_'),
        email: memberData.email,
        password: { create: createPassword('password123') },
        roles: { connect: { name: 'user' } },
        // Add some blackout dates for variety
        blackoutDates: {
          create: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
            date: getFutureDate(),
            reason: faker.datatype.boolean(0.7) ? faker.lorem.sentence() : null,
          })),
        },
      },
    })

    // Connect the user to Kody's band
    await prisma.userBand.create({
      data: {
        userId: bandMember.id,
        bandId: kodyBand.id,
        isAdmin: faker.datatype.boolean(0.2), // 20% chance of being admin
        instrument: memberData.instrument,
      },
    })
  }

  console.timeEnd('👥 Adding more members to KODY band...')

  // Create Techs for Kody Band
  console.time('🔧 Creating techs for KODY band...')

  // Get existing service types
  const serviceTypes = await prisma.serviceType.findMany()

  // Create 2-3 techs for each service type
  for (const serviceType of serviceTypes) {
    const techCount = faker.number.int({ min: 2, max: 3 })

    for (let i = 0; i < techCount; i++) {
      const tech = await prisma.tech.create({
        data: {
          name: faker.person.firstName() + ' ' + faker.person.lastName(),
          contactInfo: faker.lorem.sentence(),
          email: faker.internet.email(),
          phone: faker.phone.number(),
          rate: faker.number.int({ min: 150, max: 800 }),
          serviceTypeId: serviceType.id,
        },
      })

      // Connect tech to Kody's band
      await prisma.bandTech.create({
        data: {
          bandId: kodyBand.id,
          techId: tech.id,
        },
      })
    }
  }

  console.timeEnd('🔧 Creating techs for KODY band...')

  // Create 50 songs associated with the created band
  console.time('🎵 Creating songs for KODY band...')
  const createdSongs = []

  // Popular rock/pop artists for more realistic data
  const popularArtists = [
    'The Beatles',
    'Led Zeppelin',
    'Queen',
    'Pink Floyd',
    'The Rolling Stones',
    'AC/DC',
    'Eagles',
    'Fleetwood Mac',
    'Nirvana',
    'Pearl Jam',
    'Red Hot Chili Peppers',
    'U2',
    'Radiohead',
    'Foo Fighters',
    'Green Day',
    'Coldplay',
    'The Killers',
    'Arctic Monkeys',
    'Muse',
    'Oasis',
  ]

  const musicKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const statuses = ['active', 'learning', 'retired', 'considering']

  for (let i = 0; i < 50; i++) {
    const song = await prisma.song.create({
      data: {
        artist: popularArtists[faker.number.int({ min: 0, max: popularArtists.length - 1 })],
        title: faker.music.songName(),
        youtubeUrl: faker.datatype.boolean(0.7) ? `https://youtu.be/${faker.string.alphanumeric(11)}` : null,
        rating: faker.number.int({ min: 1, max: 5 }),
        status: statuses[faker.number.int({ min: 0, max: statuses.length - 1 })],
        key: faker.datatype.boolean(0.6) ? musicKeys[faker.number.int({ min: 0, max: musicKeys.length - 1 })] : null,
        capoPosition: faker.datatype.boolean(0.3) ? faker.number.int({ min: 1, max: 7 }) : null,
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
    createdSongs.push(song)
  }
  console.timeEnd('🎵 Creating songs for KODY band...')

  // Assign vocalists to songs
  console.time('🎤 Assigning vocalists to songs...')

  // Get all band members who could be vocalists
  const bandMembers = await prisma.userBand.findMany({
    where: { bandId: kodyBand.id },
    include: { user: true },
  })

  // Track how many songs each member is assigned as lead vocalist for even distribution
  const leadVocalistCounts: Record<string, number> = {}
  bandMembers.forEach(member => {
    leadVocalistCounts[member.userId] = 0
  })

  // Assign vocalists to songs - EVERY song gets at least a lead vocalist
  for (let songIndex = 0; songIndex < createdSongs.length; songIndex++) {
    const song = createdSongs[songIndex]

    // Find the band member with the least lead vocal assignments for even distribution
    const leadVocalist = bandMembers.reduce((prev, current) => {
      return leadVocalistCounts[prev.userId] <= leadVocalistCounts[current.userId] ? prev : current
    })

    // Assign lead vocalist with lorem ipsum notes
    await prisma.bandSongVocalist.create({
      data: {
        bandId: kodyBand.id,
        songId: song.id,
        userId: leadVocalist.userId,
        vocalType: 'lead',
        notes: faker.lorem.sentences(faker.number.int({ min: 1, max: 2 })),
      },
    })

    // Increment the count for this lead vocalist
    leadVocalistCounts[leadVocalist.userId]++

    // 70% chance of having additional vocalists (harmony, backing, etc.)
    if (faker.datatype.boolean(0.7)) {
      // Randomly assign 1-2 additional vocalists
      const numberOfAdditionalVocalists = faker.number.int({ min: 1, max: 2 })

      // Get other band members (excluding the lead vocalist)
      const otherMembers = bandMembers.filter(member => member.userId !== leadVocalist.userId)
      const selectedAdditionalMembers = faker.helpers.arrayElements(
        otherMembers,
        Math.min(numberOfAdditionalVocalists, otherMembers.length),
      )

      for (const member of selectedAdditionalMembers) {
        const vocalType = faker.helpers.arrayElement(['harmony', 'backing', 'duet'])

        try {
          await prisma.bandSongVocalist.create({
            data: {
              bandId: kodyBand.id,
              songId: song.id,
              userId: member.userId,
              vocalType,
              notes: faker.datatype.boolean(0.8) ? faker.lorem.sentence() : null,
            },
          })
        } catch (error) {
          // Skip if combination already exists (shouldn't happen with our logic, but just in case)
          console.log(`Skipping duplicate vocalist assignment for song ${song.title}`)
        }
      }
    }
  }

  // Log the distribution for debugging
  console.log('Lead vocalist distribution:')
  for (const member of bandMembers) {
    console.log(`${member.user.name || member.user.username}: ${leadVocalistCounts[member.userId]} lead vocals`)
  }

  console.timeEnd('🎤 Assigning vocalists to songs...')

  // Create setlists with two sets containing 15 songs each
  console.time('📝 Creating setlists for KODY band...')

  const setlistNames = [
    'Summer Tour 2024',
    'Acoustic Evening',
    'Rock Classics Night',
    'Festival Ready',
    'Birthday Bash Set',
  ]

  // Create 3 different setlists
  for (let setlistIndex = 0; setlistIndex < 3; setlistIndex++) {
    // Shuffle the songs array to ensure variety
    const shuffledSongs = [...createdSongs].sort(() => Math.random() - 0.5)

    const setlist = await prisma.setlist.create({
      data: {
        name: setlistNames[setlistIndex],
      },
    })

    // Connect the setlist to the band
    await prisma.bandSetlist.create({
      data: {
        bandId: kodyBand.id,
        setlistId: setlist.id,
        notes: faker.datatype.boolean(0.5) ? faker.lorem.sentence() : null,
      },
    })

    // Create two sets for this setlist
    for (let setIndex = 0; setIndex < 2; setIndex++) {
      const setName = setIndex === 0 ? 'Set 1' : 'Set 2'

      const set = await prisma.set.create({
        data: {
          name: setName,
          setlistId: setlist.id,
          order: setIndex + 1,
        },
      })

      // Add 15 unique songs to each set
      const startIndex = setIndex * 15
      const endIndex = startIndex + 15
      const songsForThisSet = shuffledSongs.slice(startIndex, endIndex)

      for (let songOrderIndex = 0; songOrderIndex < songsForThisSet.length; songOrderIndex++) {
        await prisma.setSong.create({
          data: {
            setId: set.id,
            songId: songsForThisSet[songOrderIndex].id,
            order: songOrderIndex + 1,
          },
        })
      }
    }
  }

  console.timeEnd('📝 Creating setlists for KODY band...')

  console.time('🏟️ Created venues...')
  const venueIds = []
  for (let index = 0; index < 5; index++) {
    const venue = await prisma.venue.create({
      data: {
        location: faker.location.city() + ', ' + faker.location.state({ abbreviated: true }),
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
        contacts: {
          create: [
            {
              name: faker.person.fullName(),
              email: faker.internet.email(),
              phone: faker.phone.number(),
              isPrimary: true,
              status: 'active',
            },
            // Sometimes add a secondary contact
            ...(faker.datatype.boolean(0.6)
              ? [
                  {
                    name: faker.person.fullName(),
                    email: faker.internet.email(),
                    phone: faker.phone.number(),
                    isPrimary: false,
                    status: 'active',
                  },
                ]
              : []),
          ],
        },
      },
    })
    venueIds.push(venue.id)
  }
  console.timeEnd('🏟️ Created venues...')

  // create events
  console.time('📅 Created events...')

  // Get some setlists to associate with events
  const availableSetlists = await prisma.setlist.findMany({
    where: {
      BandSetlist: {
        some: {
          bandId: kodyBand.id,
        },
      },
    },
  })

  for (let index = 0; index < 5; index++) {
    // Increased from 2 to 5 events
    const tempDate = faker.date.future({
      refDate: new Date(),
      years: 0.5,
    })
    const datePayload = new Date(Date.UTC(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate()))

    const event = await prisma.event.create({
      data: {
        date: datePayload,
        requiresPASystem: faker.datatype.boolean(),
        payment: faker.number.int({ min: 750, max: 2500 }),
        name: index < dummyEventNames.length ? dummyEventNames[index] : capitalLorem() + ' Concert',
        startEndTime: faker.helpers.arrayElement([
          '7:00 PM - 10:00 PM',
          '8:00 PM - 11:00 PM',
          '9:00 PM - 12:00 AM',
          '6:00 PM - 9:00 PM',
        ]),
        notes: faker.datatype.boolean(0.4) ? faker.lorem.paragraph() : null,
        venue: {
          connect: {
            id: venueIds[faker.number.int({ min: 0, max: venueIds.length - 1 })],
          },
        },
        // Connect some events to setlists
        setlist:
          availableSetlists.length > 0 && faker.datatype.boolean(0.6)
            ? {
                connect: {
                  id: availableSetlists[faker.number.int({ min: 0, max: availableSetlists.length - 1 })].id,
                },
              }
            : undefined,
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

    // Add some techs to events
    if (faker.datatype.boolean(0.7)) {
      // 70% chance of having techs
      const availableTechs = await prisma.tech.findMany({
        where: {
          bands: {
            some: {
              bandId: kodyBand.id,
            },
          },
        },
        take: faker.number.int({ min: 1, max: 3 }),
      })

      for (const tech of availableTechs) {
        await prisma.eventTech
          .create({
            data: {
              eventId: event.id,
              techId: tech.id,
            },
          })
          .catch(() => {
            // Ignore if already exists (duplicate key)
          })
      }
    }
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
