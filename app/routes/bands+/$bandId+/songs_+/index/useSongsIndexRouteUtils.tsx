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
              <Icon name="file-text" className="h-5 w-5 text-hyperlink hover:text-hyperlink-hover" />
            </Link>
          )}

          <a
            href={
              record.youtubeUrl ||
              `https://www.google.com/search?q=${encodeURIComponent(`${record.title} by ${record.artist}`)}+youtube+video`
            }
            target="_blank"
            rel="noreferrer"
            className="flex items-center"
            title="Search YouTube for Song Video"
          >
            <Icon name="youtube" className="h-6 w-6 stroke-hyperlink text-background hover:stroke-hyperlink-hover" />
          </a>
        </div>
      ),
    },
    {
      title: 'Artist',
      dataIndex: 'artist',
    },

    // {
    //   title: 'Rating',
    //   dataIndex: 'rating',
    // },
    // {
    //   title: 'YouTube',
    //   dataIndex: 'youtubeUrl',
    // },
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
