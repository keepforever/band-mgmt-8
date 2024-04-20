import { type Song } from '@prisma/client'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { type Column, TableGeneric } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon.js'
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
          lyrics: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  })

  return json({ songs: songs.map(song => ({ ...song.song, lyricId: song?.song?.lyrics?.id || '' })), songCount })
}

type MySong = Pick<Song, 'id' | 'title' | 'artist' | 'status' | 'rating' | 'youtubeUrl'> & { lyricId?: string }

export default function SongsIndexRoute() {
  const { songs } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const params = useParams()

  const columns: Column<MySong>[] = [
    {
      title: 'Title',
      dataIndex: 'title',
      stopPropagation: true,
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>

          {!!record.lyricId && (
            <Link
              to={`/bands/${params?.bandId}/songs/${record.id}/lyrics`}
              className="flex items-center text-muted-foreground"
            >
              <Icon name="file-text" className="fill-lime-400" />
            </Link>
          )}
        </div>
      ),
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
      title: 'YouTube',
      dataIndex: 'youtubeUrl',
    },
    // {
    //   title: 'Lyric ID',
    //   dataIndex: 'lyricId',
    //   render: value => <span>{value || 'null'}</span>,
    // },
  ]

  return (
    <div>
      <HeaderWithActions title="Songs">
        <div className="flex gap-4">
          <Button asChild variant="secondary" size="sm">
            <Link to="new">Create</Link>
          </Button>

          <Button asChild variant="destructive" size="sm">
            <Link to="bulk-upload">Bulk Upload</Link>
          </Button>
        </div>
      </HeaderWithActions>

      <TableGeneric
        columns={columns}
        data={songs}
        onRowClick={event => navigate(`/bands/${params?.bandId}/songs/${event.id}/view`)}
      />
    </div>
  )
}
