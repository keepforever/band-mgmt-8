import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate } from '@remix-run/react'
import { BandMemberCard, BandMemberPlaceholderCard } from '#app/components/band-member-card.js'
import { bandSubNavigation } from '#app/constants/navigation.js'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server'
import { getNextThreeEventsByBandId } from '#app/utils/events.server.js'
import { cn, formatDate, removeLeadingSlash } from '#app/utils/misc'

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUserId(request)
  await requireUserBelongToBand(request, params)
  const bandId = params.bandId

  const nextThreeEvents = await getNextThreeEventsByBandId(String(bandId))

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
  return json({ band, nextThreeEvents })
}

export default function BandIdIndex() {
  const { band, nextThreeEvents } = useLoaderData<typeof loader>()
  const navigate = useNavigate()

  return (
    <div className="max-w-3xl">
      <h1 className="mb-0 text-body-lg font-bold text-foreground-destructive">{band?.name}</h1>

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
          <BandMemberCard
            key={index}
            name={member.user.name || ''}
            instrument={member.instrument || 'N/A'}
            status={member.isAdmin ? 'Admin' : 'Member'}
            memberUserId={member.user.id}
          />
        ))}

        <BandMemberPlaceholderCard />
      </div>

      {/* Upcoming Events */}

      <h2 className="mb-4 text-xl font-bold">Upcoming Events</h2>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {nextThreeEvents.map(event => {
          return (
            <div key={event.id} className="group cursor-pointer rounded-md border border-border p-2">
              <Link
                to={`events/${event.id}/view`}
                className={cn('flex items-center gap-1 group-hover:text-hyperlink group-hover:underline')}
              >
                {`${formatDate(event.date)} @ ${event.venue?.name || 'TBD'}`}
              </Link>
            </div>
          )
        })}
      </div>

      {/* Quick Links */}

      <h2 className="mb-4 text-xl font-bold">Quick Links</h2>
      {/* /bands/:bandId */}

      <ul className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {bandSubNavigation.map(item => {
          return (
            <li
              key={item.name}
              className="group cursor-pointer rounded-md border border-border p-2"
              onClick={() => navigate(`${removeLeadingSlash(item.to)}`)}
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
