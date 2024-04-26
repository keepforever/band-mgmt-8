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
          instrument: true,
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
      <h1 className="mb-0 text-2xl font-bold text-foreground-destructive">{band?.name}</h1>

      {/* Current Year Revenue */}

      <div className="mb-4 flex items-center gap-2 text-body-xs font-bold text-foreground">
        <h1 className="">Projected {new Date().getFullYear()} revenue:</h1>

        <span className="font-mono">
          {band?.events
            .reduce((total, event) => total + (event?.event?.payment || 0), 0)
            .toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
        </span>
      </div>

      {/* Members */}

      <h2 className="mb-4 text-xl font-bold">Members</h2>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {band?.members?.map((member, index) => (
          <div key={index} className="flex flex-col gap-2 rounded border p-4 shadow">
            <div className="flex flex-col items-start gap-1">
              <h5 className="text-h5 font-bold">{member.user.name}</h5>
              <span
                className={cn(
                  'inline-block rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground',
                  { hidden: !member.instrument },
                )}
              >
                {member.instrument}
              </span>
            </div>

            <span
              className={cn('relative ml-auto flex-shrink-0 rounded-full px-2 py-1', {
                'bg-status-success text-status-success-foreground border-2 border-secondary-foreground': member.isAdmin,
                'bg-status-primary text-status-primary-foreground border border-muted-foreground': !member.isAdmin,
              })}
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
                className={cn('flex items-center gap-1 group-hover:text-hyperlink group-hover:underline')}
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
