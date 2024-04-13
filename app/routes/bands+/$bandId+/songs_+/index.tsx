import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { type Column, TableGeneric } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { prisma } from '#app/utils/db.server'

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const bandId = params.bandId

  const songCount = await prisma.song.count({
    where: {
      bandSongs: {
        every: {
          bandId,
        },
      },
    },
  })

  const songs = await prisma.song.findMany({
    where: {
      bandSongs: {
        every: {
          bandId,
        },
      },
    },
    select: {
      id: true,
      title: true,
      artist: true,
      status: true,
      rating: true,
      youtubeUrl: true,
    },
  })
  return json({ songs, songCount })
}

export default function BandIdIndex() {
  const { songs, songCount } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const params = useParams()

  const columns: Column<(typeof songs)[0]>[] = [
    {
      title: 'Title',
      dataIndex: 'title',
    },
    {
      title: 'Artist',
      dataIndex: 'artist',
    },
    {
      title: 'Status',
      dataIndex: 'status',
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
    },
    {
      title: 'YouTube URL',
      dataIndex: 'youtubeUrl',
    },
  ]

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="my-4 text-3xl font-bold">
          Songs
          <span className="ml-1 text-base font-normal text-foreground-destructive" aria-label="Total songs">
            ({songCount})
          </span>
        </h2>

        <Button asChild variant="secondary" size="lg">
          <Link to="new">Create</Link>
        </Button>
      </div>

      <TableGeneric
        columns={columns}
        data={songs}
        onRowClick={event => navigate(`/bands/${params?.bandId}/songs/${event.id}/view`)}
      />
    </div>
  )
}
