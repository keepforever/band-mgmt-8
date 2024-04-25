import { type Song } from '@prisma/client'
import { Link, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { type Column } from '#app/components/table-generic'
import { Icon } from '#app/components/ui/icon.js'
import { type loader } from './utils'

type MySong = Pick<Song, 'id' | 'title' | 'artist' | 'status' | 'rating' | 'youtubeUrl'> & { lyricId?: string }

export const useSongsIndexRouteUtils = () => {
  const { songs, songCount } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const params = useParams()

  const columns: Column<MySong>[] = [
    {
      title: 'Title',
      dataIndex: 'title',
      stopPropagation: (value, record) => {
        return !!record.lyricId
      },
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

  return {
    songs,
    songCount,
    navigate,
    params,
    columns,
  }
}
