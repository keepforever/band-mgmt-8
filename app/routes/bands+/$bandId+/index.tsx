import { type LoaderFunctionArgs } from '@remix-run/node'
import { json, useLoaderData } from '@remix-run/react'
import { prisma } from '#app/utils/db.server'
import { cn } from '#app/utils/misc'

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const bandId = params.bandId
  const band = await prisma.band.findUnique({
    where: {
      id: bandId,
    },
    select: {
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
    },
  })
  return json({ band })
}

export default function BandIdIndex() {
  const { band } = useLoaderData<typeof loader>()

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground-destructive">Band: {band?.name}</h1>

      <h2 className="mb-4 text-xl font-bold">Members</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {band?.members.map((member, index) => (
          <div key={index} className="rounded border p-4 shadow">
            <h2 className="text-xl font-bold">{member.user.name}</h2>
            <p className="mb-2 break-all text-gray-500">ID: {member.user.id}</p>
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
    </div>
  )
}
