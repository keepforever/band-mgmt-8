import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData } from '@remix-run/react'
import { bandSubNavigation } from '#app/constants/navigation.js'
import { prisma } from '#app/utils/db.server'
import { cn, removeLeadingSlash } from '#app/utils/misc'

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const bandId = params.bandId
  const band = await prisma.band.findUnique({
    where: {
      id: bandId,
    },
    select: {
      id: true,
      name: true,
      members: {
        select: {
          isAdmin: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      songs: {
        select: {
          song: {
            select: {
              id: true,
              title: true,
              artist: true,
              status: true,
              rating: true,
              youtubeUrl: true,
            },
          },
        },
      },
      events: {
        select: {
          event: {
            select: {
              payment: true,
            },
          },
        },
      },
    },
  })
  return json({ band })
}

export default function BandIdIndex() {
  const { band } = useLoaderData<typeof loader>()

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground-destructive">{band?.name}</h1>

      {/* Current Year Revenue */}

      <div className="mb-4 flex items-center gap-2">
        <h1 className="text-body-sm text-foreground">Projected {new Date().getFullYear()} revenue:</h1>

        <span className="text-sm text-accent-two">
          {band?.events
            .reduce((total, event) => total + (event?.event?.payment || 0), 0)
            .toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </span>
      </div>

      {/* Members */}

      <h2 className="mb-4 text-xl font-bold">Members</h2>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {band?.members.map((member, index) => (
          <div key={index} className="flex flex-col gap-2 rounded border p-4 shadow">
            <h2 className="text-xl font-bold">{member.user.name}</h2>

            <span
              className={cn(
                'relative ml-auto flex-shrink-0 rounded-full px-2 py-1',
                member.isAdmin ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400',
                'hover:text-foreground focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800',
              )}
            >
              {member.isAdmin ? 'Admin' : 'Member'}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Links */}

      <h2 className="mb-4 text-xl font-bold">Quick Links</h2>

      <ul className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {bandSubNavigation.map(item => {
          return (
            <li
              key={item.name}
              className="group cursor-pointer rounded-md bg-accent-two/30 p-4 text-foreground hover:bg-destructive/30"
            >
              <Link
                to={`${removeLeadingSlash(item.to)}`}
                className={cn('flex items-center gap-1 group-hover:text-blue-500 group-hover:underline')}
              >
                {item.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
