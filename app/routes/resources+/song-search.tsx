import { type LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/react'
import { prisma } from '#app/utils/db.server.ts'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)

  // don't search if the query is empty
  if (!url.searchParams.get('q')) {
    return json({ songs: [] } as const)
  }

  const songs =
    (await prisma.song.findMany({
      where: {
        title: { contains: url.searchParams.get('q') || '' },
        bandSongs: {
          some: {
            bandId: url.searchParams.get('bandId') || undefined,
          },
        },
      },
      select: { title: true, id: true, artist: true },
    })) || []

  return json({ songs } as const)
}
