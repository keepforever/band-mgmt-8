import { type Song } from '@prisma/client'
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

  const songs = await prisma.bandSong.findMany({
    where: {
      bandId,
    },
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
  })

  return json({ songs: songs.map(song => song.song), songCount })
}

type MySong = Pick<Song, 'id' | 'title' | 'artist' | 'status' | 'rating' | 'youtubeUrl'>

export default function BandIdIndex() {
  const { songs, songCount } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const params = useParams()

  const columns: Column<MySong>[] = [
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

  console.group(`%cindex.tsx`, 'color: yellow; font-size: 13px; font-weight: bold;')
  console.log('\n', `songs = `, songs, '\n')
  console.groupEnd()

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="my-4 text-3xl font-bold">
          Songs
          <span className="ml-1 text-base font-normal text-foreground-destructive" aria-label="Total songs">
            ({songCount})
          </span>
        </h2>

        <div className="flex gap-4">
          <Button asChild variant="secondary" size="lg">
            <Link to="new">Create</Link>
          </Button>

          <Button asChild variant="destructive" size="lg">
            <Link to="bulk-upload">Bulk Upload</Link>
          </Button>
        </div>
      </div>

      <TableGeneric
        columns={columns}
        data={songs}
        onRowClick={event => navigate(`/bands/${params?.bandId}/songs/${event.id}/view`)}
      />
    </div>
  )
}
