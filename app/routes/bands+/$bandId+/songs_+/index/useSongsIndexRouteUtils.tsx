import { type Song } from '@prisma/client'
import { Link, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { type Column } from '#app/components/table-generic'
import { Icon } from '#app/components/ui/icon.js'
import { VocalistBadge } from '#app/components/vocalist-badge.tsx'
import { type loader } from './songs-list-loader'

type MySong = Pick<Song, 'id' | 'title' | 'artist' | 'status' | 'rating' | 'youtubeUrl'> & {
  lyricId?: string
  setSongCount?: number
  vocalists?: Array<{
    user: {
      id: string
      name: string | null
      username: string
    }
  }>
}

export const useSongsIndexRouteUtils = () => {
  const { songs, songCount } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const params = useParams()

  const columns: Column<MySong>[] = [
    {
      title: 'Title',
      dataIndex: 'title',
      sortable: true,
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>

          {!!record.lyricId && (
            <Link
              to={`/bands/${params?.bandId}/songs/${record.id}/lyrics`}
              className="flex items-center text-muted-foreground"
              onClick={e => e.stopPropagation()}
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
            onClick={e => e.stopPropagation()}
          >
            <Icon name="youtube" className="h-6 w-6 stroke-hyperlink text-background hover:stroke-hyperlink-hover" />
          </a>
        </div>
      ),
    },
    {
      title: 'Artist',
      dataIndex: 'artist',
      sortable: true,
    },
    {
      title: 'Lead Vocalist',
      dataIndex: 'vocalists',
      sortable: true,
      sortKey: 'vocalist',
      render: (value: MySong['vocalists']) => (
        <div className="flex items-center gap-1">
          {value?.map(vocalist => <VocalistBadge key={vocalist.user.id} user={vocalist.user} compact />)}
          {!value?.length && <span className="text-sm text-muted-foreground">-</span>}
        </div>
      ),
    },
    {
      title: 'Used',
      dataIndex: 'setSongCount',
      sortable: true,
      render: value => (
        <div
          className="flex items-center gap-2"
          title={`Indicates that this song is used in ${value} different Set Lists`}
        >
          {value || 0}
        </div>
      ),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      sortable: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      sortable: true,
    },
  ]

  return {
    songs,
    songCount,
    navigate,
    params,
    columns,
  }
}
